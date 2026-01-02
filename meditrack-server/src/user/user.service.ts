import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/register-user.input';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserPreferencesInput } from './dto/update-user-preferences.input';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new user record.
   *
   * If `data.password` is provided in plain text it will be hashed using
   * bcrypt before persisting. To avoid double hashing, callers should pass the
   * password in plain text and let this method handle hashing.
   */
  async create(
    data: CreateUserInput & { role?: string; aud?: string },
  ): Promise<User> {
    this.logger.debug(`Creating user with email: ${data.email}`);
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExists) {
      throw new Error('User already exists');
    }

    if (data.password && !this.isBcryptHash(data.password)) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.create({ data: { ...data } as any });
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$/.test(value) && value.length === 60;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        refreshTokens: {
          select: { token: true, revoked: true, expiresAt: true },
        },
      },
    });
    const stored = user?.refreshTokens?.[0];
    if (!stored || stored.revoked || stored.expiresAt < new Date()) return false;
    return bcrypt.compare(token, stored.token);
  }

  async setRefreshToken(userId: string, token: string): Promise<void> {
    const hashed = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: { token: hashed, expiresAt, revoked: false },
      create: {
        userId,
        token: hashed,
        expiresAt,
      },
    });
  }

  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<User> {
    // Only set fields that are provided; allow explicit null to clear.
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        bedTime:
          (input as any).hasOwnProperty('bedTime') ? (input.bedTime as any) ?? null : undefined,
        breakfastTime:
          (input as any).hasOwnProperty('breakfastTime')
            ? (input.breakfastTime as any) ?? null
            : undefined,
        lunchTime:
          (input as any).hasOwnProperty('lunchTime') ? (input.lunchTime as any) ?? null : undefined,
        dinnerTime:
          (input as any).hasOwnProperty('dinnerTime') ? (input.dinnerTime as any) ?? null : undefined,
        exerciseTime:
          (input as any).hasOwnProperty('exerciseTime') ? (input.exerciseTime as any) ?? null : undefined,
      },
    });
  }

}
