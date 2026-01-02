import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { Expo } from 'expo-server-sdk';
import { Twilio } from 'twilio';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('expo-server-sdk', () => {
  const expoMock = {
    chunkPushNotifications: jest.fn(),
    sendPushNotificationsAsync: jest.fn(),
    chunkPushNotificationReceiptIds: jest.fn(),
    getPushNotificationReceiptsAsync: jest.fn(),
  };

  return { Expo: jest.fn(() => expoMock) };
});

jest.mock('twilio', () => ({
  Twilio: jest.fn(() => ({ messages: { create: jest.fn() } })),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let config: ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      device: {
        findMany: jest.fn(),
      },
    } as any;
    config = {
      get: jest.fn((key: string) => {
        if (key === 'TWILIO_ACCOUNT_SID') return 'sid';
        if (key === 'TWILIO_AUTH_TOKEN') return 'token';
        if (key === 'TWILIO_FROM_NUMBER') return '+1234567890';
        if (key === 'EXPO_ACCESS_TOKEN') return 'expo-token';
        if (key === 'EXPO_PUSH_URL') return 'https://exp.host';
        return undefined;
      }),
    } as any;
    service = new NotificationsService(config, prisma, new Logger());
  });

  describe('getExpoPushTokens', () => {
    it('deduplicates tokens and filters only valid Expo tokens', async () => {
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { expoPushToken: 'ExponentPushToken[abc]' },
        { expoPushToken: 'ExponentPushToken[abc]' },
        { expoPushToken: 'ExpoPushToken[def]' },
        { expoPushToken: 'notAToken' },
      ]);

      const tokens = await (service as any).getExpoPushTokens({ id: '1' });

      expect(tokens).toHaveLength(2);
      expect(tokens).toEqual(
        expect.arrayContaining([
          'ExponentPushToken[abc]',
          'ExpoPushToken[def]',
        ]),
      );
    });

    it('queries only devices with notifications enabled and tokens', async () => {
      (prisma.device.findMany as jest.Mock).mockResolvedValue([]);

      await (service as any).getExpoPushTokens({ id: '1' });

      expect(prisma.device.findMany).toHaveBeenCalledWith({
        where: {
          userId: '1',
          notificationsOn: true,
          expoPushToken: { not: '' },
        },
        select: { expoPushToken: true },
      });
    });
  });

  describe('sendNotification', () => {
    it('attaches provided data payload to push messages', async () => {
      (prisma.device.findMany as jest.Mock).mockResolvedValue([
        { expoPushToken: 'ExpoPushToken[token]' },
      ]);

      const expoInstance: any = (
        Expo as unknown as jest.Mock
      ).mock.results[0].value;
      const captured: any[] = [];
      expoInstance.chunkPushNotifications.mockImplementation((messages: any[]) => {
        captured.push(...messages);
        return [messages];
      });
      expoInstance.sendPushNotificationsAsync.mockResolvedValue([]);
      expoInstance.chunkPushNotificationReceiptIds.mockReturnValue([]);

      const payload = { foo: 'bar' };
      const spy = jest.spyOn(service as any, 'getExpoPushTokens');
      const result = await service.sendNotification(
        NotificationChannel.PUSH,
        { id: '1' },
        'hello',
        payload,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(captured[0]).toMatchObject({ data: payload });
      expect(result.success).toBe(true);
    });

    it('sends SMS via Twilio and returns success', async () => {
      const twilioClient: any = (Twilio as unknown as jest.Mock).mock.results[0]
        .value;
      twilioClient.messages.create.mockResolvedValue({ status: 'queued' });

      const result = await service.sendNotification(
        NotificationChannel.SMS,
        { id: '1', phoneNumber: '+15551234567' },
        'sms message',
      );

      expect(twilioClient.messages.create).toHaveBeenCalledWith({
        body: 'sms message',
        from: '+1234567890',
        to: '+15551234567',
      });
      expect(result).toEqual({ success: true });
    });

    it('propagates errors from Twilio', async () => {
      const twilioClient: any = (Twilio as unknown as jest.Mock).mock.results[0]
        .value;
      twilioClient.messages.create.mockRejectedValue(new Error('bad'));

      const result = await service.sendNotification(
        NotificationChannel.SMS,
        { id: '1', phoneNumber: '+15551234567' },
        'sms message',
      );

      expect(result).toEqual({ success: false, error: 'bad' });
    });
  });
});

