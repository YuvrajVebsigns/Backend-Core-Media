import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_METADATA } from '@common/decorators/api-standard-response.decorator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UrlService } from '@core/files/services/url.service';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  constructor(
    private reflector: Reflector,
    private urlService: UrlService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const showMetadata = request.query.showMetadata === 'true';

    const responseMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((res) => {
        // If the controller already returned a formatted response, use it
        const message =
          res?.message || responseMessage || 'Operation successful';
        let data =
          res?.data !== undefined && !res?.meta ? res.data : (res ?? null);

        if (!showMetadata) {
          data = this.stripMetadata(data);
        }

        // Dynamically resolve and append image URLs
        data = this.resolveImageUrls(data);

        return {
          success: true,
          message,
          data,
        };
      }),
    );
  }

  /**
   * Recursively finds populated File objects and moves their 'url'
   * to the parent object's corresponding field (e.g. featureImageId.url -> featureImage).
   */
  private resolveImageUrls(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.resolveImageUrls(item));
    }

    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      // Handle ObjectIds to avoid recursion/corruption
      if (data.constructor && data.constructor.name === 'ObjectId') {
        return data;
      }

      // Handle Mongoose documents or POJOs
      let result =
        typeof data.toObject === 'function' ? data.toObject() : { ...data };

      // If this object looks like a populated File, ensure it has a URL
      if (result.key && (result.id || result._id)) {
        if (!result.url) {
          result.url = this.urlService.getPublicUrl(result.key);
        }
        if (result.variants && !result.urlVariants) {
          result.urlVariants = this.urlService.getVariantUrls(result.variants);
        }
        return result;
      }

      // Traverse children and handle field mapping (e.g. logoId -> logo)
      for (const key in result) {
        result[key] = this.resolveImageUrls(result[key]);

        // If field ends in 'Id' and its value is now an object with a 'url' (populated File)
        if (
          key.endsWith('Id') &&
          result[key] &&
          typeof result[key] === 'object' &&
          result[key].url
        ) {
          const baseName = key.slice(0, -2); // 'featureImageId' -> 'featureImage'
          // Only override if the baseName field is empty or doesn't exist
          if (
            !result[baseName] ||
            typeof result[baseName] !== 'string' ||
            result[baseName].startsWith('http')
          ) {
            result[baseName] = {
              original: result[key].url,
              ...(result[key].urlVariants || {}),
            };
          }
        }
      }
      return result;
    }

    return data;
  }

  private stripMetadata(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.stripMetadata(item));
    }

    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      // Don't process ObjectIds as objects to avoid corrupted serialization
      if (data.constructor && data.constructor.name === 'ObjectId') {
        return data.toString();
      }

      // Handle Mongoose documents or POJOs
      let obj =
        typeof data.toObject === 'function' ? data.toObject() : { ...data };

      // Standardize ID and remove internal Mongoose fields
      if (obj._id) {
        obj.id = obj.id || obj._id.toString();
        delete obj._id;
      }

      // Ensure id is a string if it exists (might be a buffer from elsewhere)
      if (
        obj.id &&
        typeof obj.id !== 'string' &&
        typeof obj.id.toString === 'function'
      ) {
        obj.id = obj.id.toString();
      }

      delete obj.__v;
      delete obj.password;
      delete obj.refreshToken;

      const { isDeleted, createdAt, updatedAt, ...rest } = obj;

      const strippedRest: any = {};
      for (const key in rest) {
        strippedRest[key] = this.stripMetadata(rest[key]);
      }
      return strippedRest;
    }

    return data;
  }
}
