import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays } from 'date-fns';
import {
  DoseActionType,
  NotificationChannel,
  RepeatPattern,
} from '@prisma/client';
import { NotificationsService } from '../notification/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: Logger,
  ) {}

  private getReminderOffsets(pattern: RepeatPattern): number[] {
    switch (pattern) {
      case RepeatPattern.HOURLY:
        return [-30, -10, 0];
      case RepeatPattern.DAILY:
        return [-60, -30, 0];
      case RepeatPattern.WEEKLY:
        return [-1440, -60, -30, 0];
      case RepeatPattern.MONTHLY:
        return [-2880, -1440, -60, -30, 0];
      case RepeatPattern.CUSTOM:
        return [-1440, -60, -30, 0];
      default:
        return [-60, -30, 0];
    }
  }

  public computeReminderTimes(
    scheduledAt: Date,
    pattern: RepeatPattern,
  ): Date[] {
    return this.getReminderOffsets(pattern).map((m) =>
      new Date(scheduledAt.getTime() + m * 60000),
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async generateReminders() {
    this.logger.log('Generating reminders...', ReminderService.name);
    const now = new Date();
    const lookBackMs = 30 * 60 * 1000; // 30 minutes
    const jobName = 'generateReminders';
    const state = await this.prisma.jobState.findUnique({
      where: { jobName },
    });
    const lastRun = state?.lastRunAt ?? new Date(now.getTime() - lookBackMs);
    const windowStart = new Date(
      Math.min(lastRun.getTime(), now.getTime() - lookBackMs),
    );
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next 24 hours

    const doseTimes = await this.prisma.doseTime.findMany({
      where: {
        scheduledAt: {
          gte: windowStart,
          lte: windowEnd,
        },
        schedule: {
          medication: {
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: {
        schedule: {
          include: { medication: { include: { user: true } } },
        },
        doseActions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    for (const dt of doseTimes) {
      const schedule = dt.schedule;
      const medication = schedule.medication;

      if (medication.isArchived || !medication.isReminderOn) {
        continue;
      }

      // ensure schedule is active
      if (
        medication.medicationStartDate &&
        now <= medication.medicationStartDate
      )
        continue;
      if (
        medication.estimatedEndDate &&
        now >= medication.estimatedEndDate
      )
        continue;


      const user = medication.user;
      const scheduledTime = new Date((dt as any).scheduledAt);

      let action = dt.doseActions[0];
      if (!action) {
        action = await this.prisma.doseAction.create({
          data: {
            userId: medication.userId,
            medicationId: medication.id,
            actionType: (DoseActionType as any).PENDING,
            actionTime: scheduledTime,
            scheduledTime,
            doseTimeId: dt.id,
          },
        });
      }

      if (
        (action as any).actionType !== (DoseActionType as any).PENDING &&
        (action as any).actionType !== DoseActionType.MISSED
      ) {
        continue; // already taken or skipped
      }
      
      const reminders = this.computeReminderTimes(
        scheduledTime,
        schedule.repeatPattern,
      );

      const existingLogs = await this.prisma.notificationLog.findMany({
        where: {
          doseTimeId: dt.id,
        },
      });

      const pushLogTimes = existingLogs
        .filter((l) => l.channel === NotificationChannel.PUSH && l.sentTime)
        .map((l) => (l.sentTime as Date).getTime());
      const smsLogTimes = existingLogs
        .filter((l) => l.channel === NotificationChannel.SMS && l.sentTime)
        .map((l) => (l.sentTime as Date).getTime());

      for (let i = 0; i < reminders.length; i++) {
        const reminderTime = reminders[i];
        const reminderMs = reminderTime.getTime();

        if (reminderMs < now.getTime() - 60000) {
          if (
            user.prefersPush &&
            !pushLogTimes.some((t) => Math.abs(t - reminderMs) < 60000)
          ) {
            await this.prisma.notificationLog.create({
              data: {
                userId: user.id,
                medicationId: medication.id,
                doseTimeId: dt.id,
                scheduledTime,
                sentTime: reminderTime,
                channel: NotificationChannel.PUSH,
                successful: false,
                errorMessage: 'MISSED',
              },
            });
            pushLogTimes.push(reminderMs);
          }
          if (
            user.prefersSms &&
            !smsLogTimes.some((t) => Math.abs(t - reminderMs) < 60000)
          ) {
            await this.prisma.notificationLog.create({
              data: {
                userId: user.id,
                medicationId: medication.id,
                doseTimeId: dt.id,
                scheduledTime,
                sentTime: reminderTime,
                channel: NotificationChannel.SMS,
                successful: false,
                errorMessage: 'MISSED',
              },
            });
            smsLogTimes.push(reminderMs);
          }
          continue;
        }

        if (Math.abs(now.getTime() - reminderMs) < 60000) {
          const message =
            i === reminders.length - 1
              ? `Time to take ${medication.name}`
              : `Upcoming time to take ${medication.name}`;

          // send push notification if preferred
          const payload = {
            doseTimeId: dt.id,
            medicationId: medication.id,
            scheduledTime: scheduledTime.toISOString(),
          };

          if (user.prefersPush) {
            const recent = await this.prisma.notificationLog.findFirst({
              where: {
                doseTimeId: dt.id,
                channel: NotificationChannel.PUSH,
                createdAt: { gte: new Date(now.getTime() - 60000) },
              },
            });

            if (!recent) {
              const result = await this.notificationsService.sendNotification(
                NotificationChannel.PUSH,
                user,
                message,
                payload,
              );

              await this.prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  medicationId: medication.id,
                  doseTimeId: dt.id,
                  scheduledTime,
                  sentTime: new Date(),
                  channel: NotificationChannel.PUSH,
                  successful: result.success,
                  errorMessage: result.error,
                },
              });
            }
          }

          // send sms notification if preferred
          if (user.prefersSms) {
            const recent = await this.prisma.notificationLog.findFirst({
              where: {
                doseTimeId: dt.id,
                channel: NotificationChannel.SMS,
                createdAt: { gte: new Date(now.getTime() - 60000) },
              },
            });

            if (!recent) {
              const result = await this.notificationsService.sendNotification(
                NotificationChannel.SMS,
                user,
                message,
                payload,
              );

              await this.prisma.notificationLog.create({
                data: {
                  userId: user.id,
                  medicationId: medication.id,
                  doseTimeId: dt.id,
                  scheduledTime,
                  sentTime: new Date(),
                  channel: NotificationChannel.SMS,
                  successful: result.success,
                  errorMessage: result.error,
                },
              });
            }
          }
        }
      }

      // switch to MISSED after scheduled time passes without action
      if (
        now.getTime() - scheduledTime.getTime() >= 60000 &&
        (action as any).actionType === (DoseActionType as any).PENDING
      ) {
        await this.prisma.doseAction.update({
          where: { id: action.id },
          data: { actionType: DoseActionType.MISSED },
        });
      }
    }

    await this.prisma.jobState.upsert({
      where: { jobName },
      update: { lastRunAt: now },
      create: { jobName, lastRunAt: now },
    });
  }
}

