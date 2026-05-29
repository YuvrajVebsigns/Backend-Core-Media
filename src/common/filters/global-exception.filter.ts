import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exceptionResponse;

    // Enhanced 429 response for rate-limited requests
    if (exception instanceof ThrottlerException) {
      const retryAfter = response.getHeader('Retry-After');
      const errorDetails = {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: 'Rate limit exceeded. Please slow down and try again later.',
        retryAfter: retryAfter ? Number(retryAfter) : 60,
      };

      this.logger.warn(
        `THROTTLED: ${request.method} ${request.url} - IP: ${request.ip}`,
      );

      response.status(HttpStatus.TOO_MANY_REQUESTS).json(errorDetails);
      return;
    }

    const errorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${
          exception instanceof Error
            ? exception.stack
            : JSON.stringify(exception)
        }`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorDetails);
  }
}
