import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const showMetadata = request.query.showMetadata === 'true';

    return next.handle().pipe(
      map((res) => {
        // If the controller already returned a formatted response, use it
        const message = res?.message || 'Operation successful';
        let data = res?.data !== undefined ? res.data : (res ?? null);

        if (!showMetadata) {
          data = this.stripMetadata(data);
        }

        return {
          success: true,
          message,
          data,
        };
      }),
    );
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
      let obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };

      // Standardize ID and remove internal Mongoose fields
      if (obj._id) {
        obj.id = obj.id || obj._id.toString();
        delete obj._id;
      }
      
      // Ensure id is a string if it exists (might be a buffer from elsewhere)
      if (obj.id && typeof obj.id !== 'string' && typeof obj.id.toString === 'function') {
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
