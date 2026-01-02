import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  DoseAction as DoseActionModel,
  DoseActionType as PrismaDoseActionType,
} from '@prisma/client';
import { addDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoseActionInput } from './dto/create-dose-action.input';
import { UpdateDoseActionInput } from './dto/update-dose-action.input';

@Injectable()
export class DoseActionService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    input: CreateDoseActionInput,
  ): Promise<DoseActionModel> {
    const med = await this.prisma.medication.findFirst({
      where: {
        id: input.medicationId,
        userId,
        isArchived: false,
        isReminderOn: true,
      },
    });
    if (!med) throw new ForbiddenException('Medication not found');

    const scheduledTime = input.scheduledTime
      ? new Date(input.scheduledTime)
      : undefined;

    let action = await this.prisma.doseAction.findFirst({
      where: {
        userId,
        medicationId: input.medicationId,
        ...(scheduledTime ? { scheduledTime } : {}),
      },
    });

    if (action) {
      action = await this.prisma.doseAction.update({
        where: { id: action.id },
        data: {
          actionType: (input.actionType ?? 'PENDING') as PrismaDoseActionType,
          actionTime: new Date(input.actionTime),
          scheduledTime,
          snoozedUntil: input.snoozedUntil
            ? new Date(input.snoozedUntil)
            : undefined,
          snoozeCount: input.snoozeCount,
        },
      });
    } else {
      action = await this.prisma.doseAction.create({
        data: {
          userId,
          medicationId: input.medicationId,
          actionType: (input.actionType ?? 'PENDING') as PrismaDoseActionType,
          actionTime: new Date(input.actionTime),
          scheduledTime,
          snoozedUntil: input.snoozedUntil
            ? new Date(input.snoozedUntil)
            : undefined,
          doseTimeId: input.doseTimeId,
          snoozeCount: input.snoozeCount,
        },
      });
    }

    // If a dose was taken, update medication quantity and estimated end date
    if (input.actionType === 'TAKEN') {
      await this.prisma.$transaction(async (tx) => {
        const medication = await tx.medication.findFirst({
          where: { id: input.medicationId, userId },
          include: { schedule: { include: { doseTimes: true } } },
        });

        if (medication && medication.schedule) {
          const doseTimes = medication.schedule.doseTimes || [];

          // Determine quantity taken based on the scheduled time
          let takenQty = 1;
          if (input.scheduledTime) {
            const schedDate = new Date(input.scheduledTime);
            const schedMinutes =
              schedDate.getUTCHours() * 60 + schedDate.getUTCMinutes();
            const match = doseTimes.find((dt) => {
              const dtMinutes =
                dt.time.getUTCHours() * 60 + dt.time.getUTCMinutes();
              return dtMinutes === schedMinutes;
            });
            takenQty = match?.dosageQty ?? takenQty;
          }

          const updated = await tx.medication.updateMany({
            where: {
              id: medication.id,
              userId,
              quantityLeft: { gte: takenQty },
            },
            data: { quantityLeft: { decrement: takenQty } },
          });

          if (!updated.count) {
            throw new ForbiddenException('Insufficient medication quantity');
          }

          const current = await tx.medication.findUnique({
            where: { id: medication.id },
            select: { quantityLeft: true },
          });
          const newQuantityLeft = current?.quantityLeft ?? 0;

          // Calculate daily quantity and new estimated end date
          const dailyQty = doseTimes.reduce(
            (sum, dt) => sum + (dt.dosageQty ?? 0),
            0,
          );
          let estimatedEndDate: Date | null = null;
          if (dailyQty > 0 && newQuantityLeft > 0) {
            const daysLeft = Math.ceil(newQuantityLeft / dailyQty);
            estimatedEndDate = addDays(
              new Date(action.actionTime),
              daysLeft - 1,
            );
          }

          await tx.medication.update({
            where: { id: medication.id },
            data: { estimatedEndDate },
          });
        }
      });
    }

    return action;
  }

  async findByMedication(
    medicationId: string,
    userId: string,
  ): Promise<DoseActionModel[]> {
    return this.prisma.doseAction.findMany({
      where: {
        medicationId,
        userId,
        medication: {
          userId,
          isArchived: false,
          isReminderOn: true,
        },
      },
      orderBy: { actionTime: 'desc' },
    });
  }

  async findDoseTimesByDate(userId: string, date: string) {
    const parsed = parseISO(date);
    const start = startOfDay(parsed);
    const end = endOfDay(parsed);

    return this.prisma.doseTime.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        schedule: {
          medication: {
            userId,
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: { doseActions: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findDoseTimesByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    return this.prisma.doseTime.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        schedule: {
          medication: {
            userId,
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: { doseActions: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async update(
    userId: string,
    input: UpdateDoseActionInput,
  ): Promise<DoseActionModel> {
    const action = await this.prisma.doseAction.findFirst({
      where: { id: input.id, userId },
    });
    if (!action) throw new NotFoundException('Dose action not found');
    const updated = await this.prisma.doseAction.update({
      where: { id: input.id },
      data: {
        actionType: input.actionType
          ? (input.actionType as PrismaDoseActionType)
          : undefined,
        actionTime: input.actionTime ? new Date(input.actionTime) : undefined,
        scheduledTime: input.scheduledTime
          ? new Date(input.scheduledTime)
          : undefined,
        snoozedUntil: input.snoozedUntil
          ? new Date(input.snoozedUntil)
          : undefined,
        snoozeCount: input.snoozeCount,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<DoseActionModel> {
    const action = await this.prisma.doseAction.findFirst({
      where: { id, userId },
    });
    if (!action) throw new NotFoundException('Dose action not found');
    return this.prisma.doseAction.delete({ where: { id } });
  }

  async findDoseActionByDoseTime(
    doseTimeId: string,
    userId: string,
  ): Promise<DoseActionModel[]> {
    return this.prisma.doseAction.findMany({
      where: {
        doseTimeId,
        userId,
        doseTime: {
          schedule: {
            medication: {
              userId,
              isArchived: false,
              isReminderOn: true,
            },
          },
        },
      },
      orderBy: { actionTime: 'desc' },
    });
  }
}
