import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { CreateUserInput } from '../user/dto/register-user.input';
import { LoginResponse } from './models/login-response.model';
import { PrismaService } from '../prisma/prisma.service';
//import FormData from "form-data"; // form-data v4.0.1
import FormData = require('form-data');
import Mailgun from 'mailgun.js'; //
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { addHours } from 'date-fns';
import { redactEmail } from '../common/utils/email-redactor'; // Assuming you have a utility to redact emails
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private mailgunClient;
  private mailDomain: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.logger.debug(
      `Mailgun domain configured: ${this.config.get<string>('MAILGUN_DOMAIN')}`,
    );

    // Initialize Mailgun client
    const mailgun = new Mailgun(FormData);
    this.mailDomain =
      this.config.get<string>('MAILGUN_DOMAIN') || 'default-domain.com'; // Set your Mailgun domain
    this.mailgunClient = mailgun.client({
      username: 'api',
      key: this.config.get<string>('MAILGUN_API_KEY') || 'default-api-key',
      url: 'https://api.mailgun.net',
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    this.logger.debug(`Sending email to ${to} with subject "${subject}"`);
    return this.mailgunClient.messages.create(this.mailDomain, {
      from: `Meditrack <postmaster@${this.mailDomain}>`,
      to,
      subject,
      html,
    });
  }

  async register(input: CreateUserInput) {
    const user = await this.users.create({
      email: input.email,
      // UserService.create will hash the password if it is not already hashed
      password: input.password,
      role: 'USER',
      aud: 'mobile', // or 'web' based on your logic
      name: input.name, // Optional, can be empty
      phoneNumber: input.phoneNumber, // Optional, can be empty
      confirmationSentAt: new Date(),
      gender: input.gender,
      dob: input.dob,
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 24);
    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const link = `${this.config.get('FRONTEND_URL')}/verify?token=${token}`;
    try {
      await this.sendMail(
        user.email,
        'Verify your email',
        `<p>Hi ${user.name || ''},</p>
       <p>Click <a href="${link}">here</a> to verify (expires in 24h).</p>`,
      );
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
    }

    return user;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    if (!user.password || typeof user.password !== 'string') return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    return user;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.debug(`User ${user.id} authenticated successfully`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1d',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Optionally, save the refresh token for later validation
    await this.users.setRefreshToken(user.id, refreshToken);

    // map null → undefined so it fits your GraphQL model
    const mappedUser = user
      ? {
          id: user.id ?? undefined,
          // omit password for security
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          phoneNumber: user.phoneNumber ?? undefined, // new
          prefersPush: user.prefersPush ?? undefined,
          prefersSms: user.prefersSms ?? undefined,
          timezone: user.timezone ?? undefined,
          createdAt: user.createdAt ?? undefined,
          updatedAt: user.updatedAt ?? undefined,
          aud: user.aud ?? undefined,
          role: user.role ?? undefined,
          lastSignInAt: user.lastSignInAt ?? undefined,
          emailVerified: user.emailVerified ?? undefined,
          phoneVerified: user.phoneVerified ?? undefined,
          emailConfirmedAt: user.emailConfirmedAt ?? undefined,
          confirmationSentAt: user.confirmationSentAt ?? undefined,
          phoneConfirmedAt: user.phoneConfirmedAt ?? undefined, // new
          phoneConfirmationSentAt: user.phoneConfirmationSentAt ?? undefined, // new
          gender: user.gender ?? undefined,
          dob: user.dob ?? undefined,
          appMetadata:
            typeof user.appMetadata === 'object' && user.appMetadata !== null
              ? (user.appMetadata as Record<string, any>)
              : undefined, // new
        }
      : null;

    return { accessToken, refreshToken, user: mappedUser };
  }

  async refresh(userId: string, token: string) {
    const valid = await this.users.getRefreshToken(userId, token);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const payload = { sub: userId };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.users.revokeRefreshTokens(userId);
  }

  async verifyEmail(token: string) {
    const rec = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    this.logger.debug(`Verifying email for user ${rec?.userId}`);
    if (!rec || rec.used || rec.expiresAt < new Date()) {
      throw new Error('Invalid or expired token'); // Token not found, already used, or expired
    }
    await this.prisma.user.update({
      where: { id: rec.userId },
      data: { emailVerified: true, emailConfirmedAt: new Date() },
    });
    await this.prisma.emailVerificationToken.update({
      where: { id: rec.id },
      data: { used: true },
    });
    return 'Email verified successfully'; // Email verification successful
  }

  async requestNewEmailVerification(token: string) {
    const rec = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!rec || rec.used) {
      throw new Error('Invalid or expired token'); // Token not found, already used, or expired
    }

    const userId = rec.userId;
    const newToken = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 24);
    await this.prisma.emailVerificationToken.create({
      data: { userId: userId, token: newToken, expiresAt },
    });

    const link = `${this.config.get('FRONTEND_URL')}/verify?token=${newToken}`;

    try {
      await this.sendMail(
        rec.user.email,
        'Verify your email',
        `<p>Hi ${rec.user.name || ''},</p>

       <p>Click <a href="${link}">here</a> to verify (expires in 24h).</p>`,
      );
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
    return `New verification email sent to ${redactEmail(rec.user.email)}`; // New verification email sent successfully
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found'); // User not found

    const token = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 1);
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const link = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    try {
      await this.sendMail(
        user.email,
        'Reset your password',
        `<p>To reset your password, click <a href="${link}">here</a> (expires in 1h).</p>`,
      );
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw error;
    }

    return 'Password reset link sent'; // Password reset link sent successfully
  }

  async resetPassword(token: string, newPassword: string) {
    const rec = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!rec || rec.used || rec.expiresAt < new Date()) {
      throw new Error(
        'Invalid or expired token. Please initiate a new password reset.',
      ); // Token not found, already used, or expired
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: rec.userId },
      data: { password: hash },
    });
    await this.prisma.passwordResetToken.update({
      where: { id: rec.id },
      data: { used: true },
    });

    await this.users.revokeRefreshTokens(rec.userId);

    try {
      await this.sendMail(
        rec.user.email,
        'Verify your email',
        `<p>Hi ${rec.user.name || ''},</p>
       <p>Your password has been reset. If you did not request this, please contact support at (phone) for assistance.</p>`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send password reset confirmation email',
        error,
      );
    }

    return 'Password reset successfully'; // Password reset successful
  }
}
