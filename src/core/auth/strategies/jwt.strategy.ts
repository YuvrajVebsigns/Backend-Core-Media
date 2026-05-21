import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemUsersService } from '@core/system-users/system-users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    const user = await this.systemUsersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive. You have been logged out.',
      );
    }

    // Return the full user object (including role and permissions)
    // This will be attached to the Request as req.user
    return user;
  }
}
