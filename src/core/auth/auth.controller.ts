import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ApiStandardResponse } from '@common/decorators/api-standard-response.decorator';
import { AuthService } from './auth.service';
import {
  LoginDto,
  SignupDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  LoginResponseDto,
  AuthMessageResponseDto,
  VerifyOtpResponseDto,
  RefreshTokenDto,
  RefreshResponseDto,
} from './dto/auth.dto';
import {
  CreateSystemUserDto,
  SystemUserResponseDto,
} from '@core/system-users/dto/system-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Admin | Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({
    short: { ttl: 1000, limit: 3 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 3600000, limit: 30 },
  })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiStandardResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('signup')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 3600000, limit: 20 },
  })
  @ApiOperation({ summary: 'Create a new system user (Signup)' })
  @ApiStandardResponse({
    status: 201,
    description: 'User created successfully',
    type: SystemUserResponseDto,
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('forgot-password')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 3600000, limit: 10 },
  })
  @ApiOperation({ summary: 'Request OTP for password reset' })
  @ApiStandardResponse({
    status: 200,
    description: 'OTP sent successfully (check console)',
    type: AuthMessageResponseDto,
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendOtp(forgotPasswordDto.email);
  }

  @Post('verify-otp')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 3600000, limit: 20 },
  })
  @ApiOperation({ summary: 'Verify OTP and get reset token' })
  @ApiStandardResponse({
    status: 200,
    description: 'OTP verified, returns resetToken',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyDto.email, verifyDto.otp);
  }

  @Post('reset-password')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 3600000, limit: 10 },
  })
  @ApiOperation({ summary: 'Reset password using the reset token' })
  @ApiStandardResponse({
    status: 200,
    description: 'Password reset successfully',
    type: AuthMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetDto.resetToken,
      resetDto.newPassword,
    );
  }

  @Post('refresh')
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 3600000, limit: 100 },
  })
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiStandardResponse({
    status: 200,
    description: 'Tokens refreshed',
    type: RefreshResponseDto,
  })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiStandardResponse({
    status: 200,
    description: 'Logged out successfully',
    type: AuthMessageResponseDto,
  })
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile data including role and permissions',
  })
  @ApiStandardResponse({
    status: 200,
    description: 'User profile fetched successfully',
    type: SystemUserResponseDto,
  })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }
}
