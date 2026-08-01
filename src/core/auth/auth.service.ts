import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SystemUsersService } from '@core/system-users/system-users.service';
import * as bcrypt from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { RolesService } from '@core/roles/roles.service';
import { SystemUserRole } from '@common/enums/role.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunicationsService } from '@modules/communications/communications.service';
import {
  AppEvents,
  UserSignedUpEvent,
  UserLoggedInEvent,
  PasswordResetEvent,
  UserScreenshotViolationEvent,
} from '@modules/events/event-definitions';

@Injectable()
export class AuthService {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    private readonly communicationsService: CommunicationsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.systemUsersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      if (user.isActive === false) {
        throw new UnauthorizedException(
          'Your account has been disabled. Please contact an Administrator to re-enable your account.',
        );
      }
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      roleKey: user.role?.roleKey,
      permissions: user.role?.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '7d') as any,
      },
    );

    // Store hashed refresh token and update last login in database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.systemUsersService.update(user.id, {
      refreshToken: hashedRefreshToken,
      lastLogin: new Date(),
    });

    this.eventEmitter.emit(
      AppEvents.USER_LOGGED_IN,
      new UserLoggedInEvent(user.id || user._id.toString(), user.email),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async refreshTokens(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.systemUsersService.findOneWithRefreshToken(
        payload.sub,
      );

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      if (user.isActive === false) {
        throw new UnauthorizedException(
          'Your account is inactive. You are not allowed to login.',
        );
      }

      const refreshTokenMatches = await bcrypt.compare(
        token,
        user.refreshToken,
      );
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access Denied');
      }

      return this.generateNewTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateNewTokens(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      roleKey: user.role?.roleKey,
      permissions: user.role?.permissions || [],
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '7d') as any,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.systemUsersService.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(userId: string) {
    await this.systemUsersService.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async signup(signupDto: any) {
    const role = await this.rolesService.findByRoleKey(SystemUserRole.STAFF);
    if (!role) {
      throw new NotFoundException('Default role STAFF not found');
    }
    const user = await this.systemUsersService.create({
      ...signupDto,
      role: role._id,
    });

    this.eventEmitter.emit(
      AppEvents.USER_SIGNED_UP,
      new UserSignedUpEvent(
        user.id || (user as any)._id.toString(),
        user.email,
        user.fullName,
        role.roleKey,
      ),
    );

    return user;
  }

  async sendOtp(email: string) {
    const user = await this.systemUsersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cacheManager.set(`otp_${email}`, otp, 600000); // 10 minutes TTL

    console.log('\n┌─────────────────────────────────────────────────────┐');
    console.log('│                📧  OTP Verification Code             │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log(`│  EMAIL    : ${email.padEnd(40)}│`);
    console.log(`│  OTP      : ${otp.padEnd(40)}│`);
    console.log('└─────────────────────────────────────────────────────┘\n');

    return { message: 'OTP sent successfully to console' };
  }

  async verifyOtp(email: string, otp: string) {
    const cachedOtp = await this.cacheManager.get(`otp_${email}`);
    if (!cachedOtp || cachedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.cacheManager.del(`otp_${email}`);

    // Generate a temporary token for password reset/creation
    const payload = { email, type: 'password_reset' };
    const resetToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_RESET_EXPIRES_IN') ||
        '15m') as any,
    });

    return {
      message: 'OTP verified successfully',
      reset_token: resetToken,
    };
  }

  async resetPassword(resetToken: string, newPassword: any) {
    try {
      const payload = this.jwtService.verify(resetToken);
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.systemUsersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.systemUsersService.update(user.id, { password: newPassword });

      this.eventEmitter.emit(
        AppEvents.PASSWORD_RESET,
        new PasswordResetEvent(
          user.id || (user as any)._id.toString(),
          user.email,
        ),
      );

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async getMe(userId: string) {
    return this.systemUsersService.findOne(userId);
  }

  async reportScreenshotViolation(userId: string) {
    const user = await this.systemUsersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Disable user account & clear refresh token to force logout
    await this.systemUsersService.update(userId, {
      isActive: false,
      refreshToken: null,
    });

    // 2. Dispatch alert email to system administrator
    const adminEmail =
      this.configService.get<string>('ADMIN_ALERT_EMAIL') || 'admin@vebsigns.com';
    const userRoleName =
      (user.role as any)?.name || (user.role as any)?.roleKey || 'Staff User';

    const subject = `🚨 SECURITY ALERT: Screenshot Detected - Account Disabled (${user.fullName})`;
    const content = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc2626;">🚨 Security Violation Alert</h2>
        <p>A screenshot capture attempt was detected on the Admin Panel by an active user.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">User Name:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${user.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${user.email}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Role:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${userRoleName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Detection Time:</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date().toLocaleString()}</td>
          </tr>
          <tr style="background-color: #fee2e2;">
            <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold; color: #991b1b;">Account Action:</td>
            <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold; color: #991b1b;">ACCOUNT AUTOMATICALLY DISABLED (INACTIVE)</td>
          </tr>
        </table>
        <p><strong>Action Required:</strong> The user's active session has been terminated and access blocked. Following your security inquiry, an administrator can re-enable this account via the Admin Panel under <strong>System Users</strong>.</p>
      </div>
    `;

    try {
      await this.communicationsService.sendEmail(
        adminEmail,
        subject,
        content,
        {
          violation: 'SCREENSHOT_ATTEMPT',
          userId: user.id || (user as any)._id.toString(),
          userEmail: user.email,
        },
      );
    } catch (err: any) {
      // Log error safely without blocking response
      console.error(
        `Failed to send screenshot violation alert email for ${user.email}:`,
        err?.message || err,
      );
    }

    this.eventEmitter.emit(
      AppEvents.SECURITY_VIOLATION_SCREENSHOT,
      new UserScreenshotViolationEvent(
        user.id || (user as any)._id.toString(),
        user.email,
        user.fullName,
        userRoleName,
      ),
    );

    return {
      message:
        'Account disabled due to screenshot security violation. Administrator notified.',
    };
  }
}
