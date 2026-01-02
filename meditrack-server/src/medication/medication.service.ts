import { Injectable, NotFoundException } from '@nestjs/common';
import { Medication } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicationInput } from './dto/update-medication.input';
import { CreateMedicationExtendedInput } from './dto/create-medication-extended.input';

@Injectable()
export class MedicationService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    input: CreateMedicationExtendedInput,
  ): Promise<Medication> {
    const totalCount = input.totalCount ?? input.quantity;
    const quantityLeft = input.quantityLeft ?? totalCount;

    const medColors = ["#ef4444", "#f97316", "#f43f5e", "#ec4899", "#6366f1", "#a855f7", "#3b82f6","#06b6d4" , "#22c55e", "#8b5cf6", "#84cc16", "#b91c1c", "#c2410c",
"#b45309", "#4d7c0f", "#047857", "#0e7490", "#1d4ed8", "#6d28d9", "#a21caf", "#be123c", "#f87171", "#fb923c", "#fbbf24", "#4ade80", "#34d399", "#2dd4bf", "#38bdf8", "#818cf8",
"#c084fc", "#e879f9", "#fb7185", "#9d174d"];
    const randomColor = medColors[Math.floor(Math.random() * medColors.length)];

    return this.prisma.medication.create({
      data: {
        userId,
        name: input.name,
        strength: input.strength,
        quantity: totalCount,
        quantityLeft,
        instructions: input.instructions,
        medicationStartDate: input.medicationStartDate
          ? new Date(input.medicationStartDate)
          : undefined,
        estimatedEndDate: input.estimatedEndDate
          ? new Date(input.estimatedEndDate)
          : undefined,
        therapy: input.therapy,
        color: randomColor,
      },
    });
  }

  async findAll(userId: string): Promise<any[]> {
    // Include schedule and only the dosageUnit field from related doseTimes
    return this.prisma.medication.findMany({
      where: { userId },
      include: {
        schedule: {
          include: {
            doseTimes: {
              select: { dosageUnit: true },
            },
          },
        },
      },
    }) as any;
  }

  async findOne(id: string, userId: string): Promise<Medication> {
    const medication = await this.prisma.medication.findFirst({
      where: { id, userId },
    });
    if (!medication) {
      throw new NotFoundException('Medication not found');
    }
    return medication;
  }

  async update(
    id: string,
    userId: string,
    input: UpdateMedicationInput,
  ): Promise<Medication> {
    await this.findOne(id, userId);
    return this.prisma.medication.update({
      where: { id },
      data: { ...input },
    });
  }

  async remove(id: string, userId: string): Promise<Medication> {
    await this.findOne(id, userId);
    return this.prisma.medication.delete({ where: { id } });
  }
}
