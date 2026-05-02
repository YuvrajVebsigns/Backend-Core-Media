import {
  CacheInterceptor,
} from '@nestjs/cache-manager';
import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RoleCacheInterceptor extends CacheInterceptor {
  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;
    const isHttpApp = httpAdapter && !!httpAdapter.getRequestMethod;
    const cacheMetadata = this.reflector.get(
      'cache_metadata_key',
      context.getHandler(),
    );

    if (!isHttpApp || cacheMetadata) {
      return undefined;
    }

    const requestMethod = httpAdapter.getRequestMethod(request);
    if (requestMethod !== 'GET') {
      return undefined;
    }

    const url = httpAdapter.getRequestUrl(request);
    
    // Disable global caching for ALL admin routes to ensure real-time data
    if (url.includes('/admin')) {
      return undefined;
    }

    const userRole = request.user?.role?.name || 'guest';

    // Create a unique cache key per URL + User Role
    return `${url}:${userRole}`;
  }
}
