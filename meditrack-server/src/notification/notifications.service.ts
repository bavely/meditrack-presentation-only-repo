import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '@prisma/client';
import {
  Expo,
  ExpoPushTicket,
  ExpoPushSuccessTicket,
} from 'expo-server-sdk';
import { Twilio } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class NotificationsService {
  private expo: Expo;
  private twilioClient: Twilio;
  private readonly expoAccessToken?: string;
  private readonly expoPushUrl?: string;
  private readonly hasExpoCredentials: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {
    this.expoAccessToken =
      this.configService.get<string>('EXPO_ACCESS_TOKEN')?.trim() || undefined;
    this.expoPushUrl =
      this.configService.get<string>('EXPO_PUSH_URL')?.trim() || undefined;

    if (this.expoPushUrl) {
      try {
        const parsedUrl = new URL(this.expoPushUrl);
        process.env.EXPO_BASE_URL = parsedUrl.origin;
      } catch {
        process.env.EXPO_BASE_URL = this.expoPushUrl;
      }
    }

    this.hasExpoCredentials = Boolean(this.expoAccessToken);

    const expoOptions = this.expoAccessToken
      ? { accessToken: this.expoAccessToken }
      : {};
    this.expo = new Expo(expoOptions);
    this.twilioClient = new Twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID') as string,
      this.configService.get<string>('TWILIO_AUTH_TOKEN') as string,
    );
  }
  private async getExpoPushTokens(user: { id: any }): Promise<string[]> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId: user.id,
        notificationsOn: true,
        expoPushToken: { not: '' },
      },
      select: { expoPushToken: true },
    });
    const tokens = new Set<string>(devices.map((d) => d.expoPushToken));

    return Array.from(tokens).filter(
      (t) =>
        /^ExponentPushToken\[.*\]$/.test(t) || /^ExpoPushToken\[.*\]$/.test(t),
    );
  }

  async sendNotification(
    channel: NotificationChannel,
    user: { id: string; phoneNumber?: string | null; appMetadata?: any },
    message: string,
    payload?: Record<string, any>,
  ): Promise<{ success: boolean; error?: string }> {
    if (channel === NotificationChannel.SMS) {
      if (!user.phoneNumber) {
        return { success: false, error: 'No phone number' };
      }
      try {
        const result: any = await this.twilioClient.messages.create({
          body: message,
          from: this.configService.get<string>('TWILIO_FROM_NUMBER'),
          to: user.phoneNumber,
        });
        if (
          ['failed', 'undelivered'].includes((result.status as string) ?? '')
        ) {
          return {
            success: false,
            error: result.errorMessage || result.status,
          };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }

    if (channel === NotificationChannel.PUSH) {
      this.logger.log('Sending push notification', NotificationsService.name);
      if (!this.hasExpoCredentials) {
        const missingVars = ['EXPO_ACCESS_TOKEN'];
        if (!this.expoPushUrl) {
          missingVars.push('EXPO_PUSH_URL');
        }
        this.logger.warn(
          `Push notification requested but Expo credentials are not configured (missing: ${missingVars.join(
            ', ',
          )})`,
          NotificationsService.name,
        );
        return {
          success: false,
          error: 'Expo push notifications are not configured',
        };
      }
      const tokens = await this.getExpoPushTokens(user);
      if (tokens.length === 0) {
        return { success: false, error: 'No Expo push tokens' };
      }
      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        body: message,
        ...(payload ? { data: payload } : {}),
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];
      let success = true;
      const errors: string[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          for (const ticket of ticketChunk) {
            if (ticket.status !== 'ok') {
              success = false;
              if (ticket.message) {
                errors.push(ticket.message);
              }
            }
          }
        } catch (e: any) {
          success = false;
          if (e?.message) {
            errors.push(e.message);
          }
        }
      }

      const receiptIds = tickets
        .filter((t): t is ExpoPushSuccessTicket => t.status === 'ok')
        .map((t) => t.id);
      const receiptChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          for (const receiptId in receipts) {
            const receipt: any = receipts[receiptId];
            if (receipt.status !== 'ok') {
              success = false;
              if (receipt.message) {
                errors.push(receipt.message);
              }
              if (receipt.details?.error) {
                errors.push(receipt.details.error);
              }
            }
          }
        } catch (e: any) {
          success = false;
          if (e?.message) {
            errors.push(e.message);
          }
        }
      }

      return { success, error: errors.join('; ') || undefined };
    }

    return { success: false, error: 'Unsupported channel' };
  }
}
