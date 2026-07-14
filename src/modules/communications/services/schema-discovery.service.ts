import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CommunicationVariable } from '../schemas/communication-variable.schema';

export interface FieldDiscovery {
  path: string;
  type: string;
  isArray: boolean;
  ref?: string;
  subFields?: FieldDiscovery[];
}

export interface SchemaDiscoveryResult {
  modelName: string;
  fields: FieldDiscovery[];
}

@Injectable()
export class SchemaDiscoveryService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CommunicationVariable.name)
    private readonly variableModel: Model<CommunicationVariable>,
  ) {}

  /**
   * Discovers variables stored in the database.
   * Groups variables by modelName to return SchemaDiscoveryResult[].
   */
  async discoverSchemas(): Promise<SchemaDiscoveryResult[]> {
    const variables = await this.variableModel
      .find({ isActive: true, isDeleted: null })
      .exec();

    const grouped: Record<string, FieldDiscovery[]> = {};

    for (const variable of variables) {
      if (!grouped[variable.modelName]) {
        grouped[variable.modelName] = [];
      }

      grouped[variable.modelName].push({
        path: variable.path,
        type: variable.type || 'String',
        isArray: variable.isArray || false,
        ref: variable.ref,
      });
    }

    return Object.entries(grouped).map(([modelName, fields]) => ({
      modelName,
      fields,
    }));
  }

  /**
   * Original Mongoose-based schema traversal.
   * Kept as a utility so the super admin can inspect available database keys and register them.
   */
  discoverRawMongooseSchemas(): SchemaDiscoveryResult[] {
    const models = this.connection.models;
    const result: SchemaDiscoveryResult[] = [];

    // Filter models to keep only communication-relevant CMS collections
    const allowedModels = [
      'Nomination',
      'Registree',
      'Website',
      'Blog',
      'Contact',
      'Sponsor',
      'Event',
      'Attendee',
    ];

    // System/private fields to exclude from variable auto-discovery
    const excludedFields = [
      '_id',
      'id',
      '__v',
      'password',
      'salt',
      'token',
      'secret',
      'key',
      'deletedAt',
      'isDeleted',
      'createdBy',
      'updatedBy',
      'createdAt',
      'updatedAt',
    ];

    for (const [modelName, model] of Object.entries(models)) {
      if (!allowedModels.includes(modelName)) {
        continue;
      }

      const fields: FieldDiscovery[] = [];
      const paths = model.schema.paths;

      for (const [pathKey, rawPathObj] of Object.entries(paths)) {
        const pathObj = rawPathObj as any;
        // Skip root excluded fields or matches for passwords/tokens
        const lowerPath = pathKey.toLowerCase();
        if (
          excludedFields.includes(pathKey) ||
          lowerPath.includes('password') ||
          lowerPath.includes('token') ||
          lowerPath.includes('secret') ||
          lowerPath.includes('key') ||
          lowerPath.includes('salt')
        ) {
          continue;
        }

        let type = pathObj.instance;
        let isArray = false;
        let ref = pathObj.options?.ref;
        const subFields: FieldDiscovery[] = [];

        if (type === 'Array') {
          isArray = true;
          const caster = pathObj.caster;
          if (caster) {
            type = caster.instance || 'Object';
            if (caster.options?.ref) {
              ref = caster.options.ref;
            }
            if (caster.schema) {
              for (const [subKey, subObj] of Object.entries(
                caster.schema.paths,
              )) {
                const subLower = subKey.toLowerCase();
                if (
                  excludedFields.includes(subKey) ||
                  subLower.includes('password') ||
                  subLower.includes('token') ||
                  subLower.includes('secret') ||
                  subLower.includes('key') ||
                  subLower.includes('salt') ||
                  subKey === '_id' ||
                  subKey === 'id'
                ) {
                  continue;
                }
                subFields.push({
                  path: subKey,
                  type: (subObj as any).instance || 'String',
                  isArray: false,
                  ref: (subObj as any).options?.ref,
                });

                // Expose nested subfield with prefix parent path
                fields.push({
                  path: `${pathKey}.${subKey}`,
                  type: (subObj as any).instance || 'String',
                  isArray: false,
                  ref: (subObj as any).options?.ref,
                });
              }
            }
          }
        }

        fields.push({
          path: pathKey,
          type: type || 'String',
          isArray,
          ref,
          subFields: subFields.length > 0 ? subFields : undefined,
        });
      }

      result.push({
        modelName,
        fields,
      });
    }

    return result;
  }
}
