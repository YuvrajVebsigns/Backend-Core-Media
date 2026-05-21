import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WebsiteAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Website token is required');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'website') {
        throw new UnauthorizedException('Invalid website token type');
      }

      // Attach website details to the request for controller access
      request.website = {
        id: payload.websiteId,
        domain: payload.domain,
        slug: payload.slug,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired website token');
    }
  }
}
