import { applyDecorators, Type, SetMetadata } from '@nestjs/common';
import { ApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

export interface ApiStandardResponseOptions {
  status?: number;
  description?: string;
  type?: Type<any> | any;
  isArray?: boolean;
}

export const RESPONSE_MESSAGE_METADATA = 'response_message';

export const ApiStandardResponse = (options: ApiStandardResponseOptions) => {
  const status = options.status || 200;
  const description = options.description || 'Operation successful';
  const isArray = options.isArray || false;
  const model = options.type;

  const decorators: any[] = [];

  let dataProperty: any = { type: 'object', nullable: true };

  if (model) {
    if (typeof model === 'function') {
      decorators.push(ApiExtraModels(model));
      dataProperty = isArray
        ? { type: 'array', items: { $ref: getSchemaPath(model) } }
        : { $ref: getSchemaPath(model) };
    } else {
      dataProperty = isArray
        ? { type: 'array', items: { type: typeof model === 'string' ? model : 'object' } }
        : { type: typeof model === 'string' ? model : 'object' };
    }
  }

  decorators.push(
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: description },
              data: dataProperty,
            },
          },
        ],
      },
    }),
    SetMetadata(RESPONSE_MESSAGE_METADATA, description),
  );

  return applyDecorators(...decorators);
};
