import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { SystemUserResponseDto } from '../../system-users/dto/system-user.dto';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@coremedia.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'AdminPassword123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@coremedia.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'admin@coremedia.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'JWT token received after OTP verification' })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'def789...' })
  refresh_token: string;

  @ApiProperty({ type: SystemUserResponseDto })
  user: SystemUserResponseDto;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'def789...', description: 'The refresh token received during login' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1Ni...' })
  access_token: string;

  @ApiProperty({ example: 'def789...' })
  refresh_token: string;
}

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: 'OTP verified successfully' })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1Ni...' })
  reset_token: string;
}
