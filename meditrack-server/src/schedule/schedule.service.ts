import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  Schedule as ScheduleModel,
  RepeatPattern as PrismaRepeatPattern,
  DoseActionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { UpdateScheduleInput } from './dto/update-schedule.input';
import { PlannedSchedule } from '../ai/models/medication-plan.model';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';
import { addDays } from 'date-fns';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  private timeStringToDate(t: string): Date {
    return new Date(`1970-01-01T${t}:00Z`);
  }

  private getStep(pattern: RepeatPattern, intervalDays?: number): number {
    if (intervalDays && intervalDays > 0) return intervalDays;
    switch (pattern) {
      case RepeatPattern.WEEKLY:
        return 7;
      case RepeatPattern.MONTHLY:
        return 30;
      default:
        return 1;
    }
  }

  private async generateDoseTimes(
    prisma: PrismaService | Prisma.TransactionClient,
    scheduleId: string,
    medicationId: string,
    userId: string,
    times: { scheduledAt: string; dosageQty: number; dosageUnit: string }[],
    startDate: string,
    repeatPattern: RepeatPattern,
    durationDays: number,
    intervalDays: number | undefined,
    quantityLeft: number,
  ) {
    const step = this.getStep(repeatPattern, intervalDays);
    // If quantityLeft is zero or negative we still want to seed initial
    // dose times so that future scheduling continues. Treat a non-positive
    // quantity as effectively unlimited for the purpose of generating the
    // first set of dose times.
    let remaining = quantityLeft > 0 ? quantityLeft : Number.MAX_SAFE_INTEGER;
    const start = new Date(startDate);
    const now = new Date();
    const parsed = times
      .map((t) => {
        const first = new Date(t.scheduledAt);
        const timeStr = first.toISOString().substring(11, 16);
        return {
          first,
          timeStr,
          dosageQty: t.dosageQty,
          dosageUnit: t.dosageUnit,
        };
      })
      .sort((a, b) => a.first.getTime() - b.first.getTime());
    const uniqueDates = new Set(parsed.map((p) => p.first.toDateString()));

    if (uniqueDates.size > 1) {
      for (const t of parsed) {
        if (remaining < t.dosageQty) break;
        const doseDate = t.first;
        if (doseDate < now) continue;
        const doseTime = await prisma.doseTime.create({
          data: {
            scheduleId,
            time: this.timeStringToDate(t.timeStr),
            scheduledAt: doseDate,
            dosageQty: t.dosageQty,
            dosageUnit: t.dosageUnit,
          } as any,
        });
        await prisma.doseAction.create({
          data: {
            userId,
            medicationId,
            actionType: (DoseActionType as any).PENDING,
            actionTime: doseDate,
            scheduledTime: doseDate,
            doseTimeId: doseTime.id,
          } as any,
        });
        remaining -= t.dosageQty;
        if (remaining <= 0) break;
      }
    } else {
      for (
        let day = 0;
        day < durationDays && remaining > 0;
        day += step
      ) {
        for (const t of parsed) {
          if (remaining < t.dosageQty) break;
          const doseDate = addDays(start, day);
          doseDate.setUTCHours(t.first.getUTCHours(), t.first.getUTCMinutes(), 0, 0);
          if (doseDate < now) continue;
          const doseTime = await prisma.doseTime.create({
            data: {
              scheduleId,
              time: this.timeStringToDate(t.timeStr),
              scheduledAt: doseDate,
              dosageQty: t.dosageQty,
              dosageUnit: t.dosageUnit,
            } as any,
          });
          await prisma.doseAction.create({
            data: {
              userId,
              medicationId,
              actionType: (DoseActionType as any).PENDING,
              actionTime: doseDate,
              scheduledTime: doseDate,
              doseTimeId: doseTime.id,
            } as any,
          });
          remaining -= t.dosageQty;
          if (remaining <= 0) break;
        }
      }
    }

    return;
  }

  /**
   * Convert an AI planned schedule into a CreateScheduleInput structure
   * used by the rest of the service. The AI currently returns the total
   * number of doses to take and the times within a day. From this we
   * derive the repeat pattern, start date and duration in days.
   */
 public fromAiSchedule(
    plan: PlannedSchedule,
  ): Omit<CreateScheduleInput, 'medicationId'> & { estimatedEndDate: string } {
    const { firstTime, lastTime, totalCount , intervalUnit, interval , frequency, doseDates } = plan;
    const userLastTime = new Date(lastTime);
    const timesFromAi = plan.times || [];


    let repeatPattern: RepeatPattern;
    if (intervalUnit === 'h') {
      repeatPattern = RepeatPattern.HOURLY;
    } else if (intervalUnit === 'd') {
      repeatPattern = RepeatPattern.DAILY;
    } else if (intervalUnit === 'wk') {
      repeatPattern = RepeatPattern.WEEKLY;
    } else if (intervalUnit === 'mo') {
      repeatPattern = RepeatPattern.MONTHLY;
    } else {
      repeatPattern = RepeatPattern.CUSTOM;
    }

    let step: number;
    if (intervalUnit === 'h') {
      step = 1/24;
    } else if (intervalUnit === 'd') {
      step = 1;
    } else if (intervalUnit === 'wk') {
      step =  7;
    } else if (intervalUnit === 'mo') {
      step = 30;
    } else {
      step = 1;
    }

    const safeInterval = interval ?? 1;
    const safeFrequency = frequency ?? 1;
    const durationDays = (totalCount * safeInterval * step) / safeFrequency;

    const estimatedEndDate = new Date(lastTime);
    estimatedEndDate.setDate(userLastTime.getDate() + durationDays);

    const doseDatesDetected: string[] = [];

    if (doseDates && doseDates.length > 0) {
      for (const d of doseDates) {
        const dt = new Date(d);
        doseDatesDetected.push(dt.toISOString());
      }
    }else {
      const base = new Date(firstTime);
      for (let i = 0; i < durationDays; i++) {
        base.setDate(base.getDate() + step);
        doseDatesDetected.push(base.toISOString());
      }
    }

    const times: { scheduledAt: string; dosageQty: number; dosageUnit: string }[] = [];

   for (const timeFromAi of timesFromAi) {

    for (const doseDate of doseDatesDetected) {
      const dt = new Date(doseDate).toISOString();
      const [h, m] = (timeFromAi.time || '08:00').split(':').map(Number);
      console.log(`Time: ${h}:${m}`);
      const dtToArr = dt.split('T');
      const datePart = dtToArr[0];
      const ndt = new Date(`${datePart}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00Z`).toISOString();
      times.push({
        scheduledAt: ndt,
        dosageQty: timeFromAi.dosageQty,
        dosageUnit: timeFromAi.dosageUnit,
      });
    }
   }


        return {
      repeatPattern: repeatPattern,
      startDate: userLastTime.toISOString(),
      estimatedEndDate: estimatedEndDate.toISOString(),
      durationDays,
      interval,
      intervalDays: step,
      times,
      frequency : safeFrequency,
    };
  }


  async create(userId: string, input: CreateScheduleInput): Promise<ScheduleModel> {
    await this.prisma.$transaction(async (tx) => {
      const med = await tx.medication.findFirst({
        where: { id: input.medicationId, userId },
      });
      if (!med) throw new ForbiddenException('Medication not found');

      const schedule = await tx.schedule.create({
        data: {
          medicationId: input.medicationId,
          repeatPattern: input.repeatPattern as PrismaRepeatPattern,
          interval: input.interval ?? 1,
          startDate: new Date(input.startDate),
          durationDays: input.durationDays,
          frequency: input.frequency,
        },
      });

      await this.generateDoseTimes(
        tx,
        schedule.id,
        med.id,
        med.userId,
        input.times,
        input.startDate,
        input.repeatPattern,
        input.durationDays,
        input.intervalDays,
        med.quantityLeft,
      );
    });

    return this.findByMedication(input.medicationId, userId);
  }

  async findByMedication(
    medicationId: string,
    userId: string,
  ): Promise<ScheduleModel & { doseTimes: any[] }> {
    const schedule = await this.prisma.schedule.findFirst({
      where: { medicationId, medication: { userId } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    const doseTimes = await this.prisma.doseTime.findMany({
      where: { scheduleId: schedule.id },
    });
    return { ...schedule, doseTimes } as any;
  }

  async update(userId: string, input: UpdateScheduleInput): Promise<ScheduleModel> {
    const existing = await this.prisma.schedule.findFirst({
      where: { id: input.id, medication: { userId } },
    });
    if (!existing) throw new NotFoundException('Schedule not found');
    const med = await this.prisma.medication.findFirst({
      where: { id: existing.medicationId, userId },
    });

    const oldDoseTimeIds = (
      await this.prisma.doseTime.findMany({
        where: { scheduleId: input.id },
        select: { id: true },
      })
    ).map((dt) => dt.id);

    if (oldDoseTimeIds.length) {
      await this.prisma.doseAction.deleteMany({
        where: { doseTimeId: { in: oldDoseTimeIds } },
      });
    }

    await this.prisma.doseTime.deleteMany({ where: { scheduleId: input.id } });

    const schedule = await this.prisma.schedule.update({
      where: { id: input.id },
      data: {
        repeatPattern: input.repeatPattern as PrismaRepeatPattern,
        interval: input.interval ?? existing.interval,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        durationDays: input.durationDays,
      },
    });

    if (input.times && input.times.length) {
      await this.generateDoseTimes(
        this.prisma,
        schedule.id,
        existing.medicationId,
        userId,
        input.times,
        schedule.startDate.toISOString(),
        schedule.repeatPattern as RepeatPattern,
        schedule.durationDays,
        input.intervalDays,
        med?.quantityLeft ?? 0,
      );
    }

    const doseTimes = await this.prisma.doseTime.findMany({
      where: { scheduleId: schedule.id },
    });

    return { ...schedule, doseTimes } as any;
  }

  async remove(id: string, userId: string): Promise<ScheduleModel> {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, medication: { userId } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    await this.prisma.doseTime.deleteMany({ where: { scheduleId: id } });
    return this.prisma.schedule.delete({ where: { id } });
  }
}
