import { Test, TestingModule } from '@nestjs/testing';
import { VariableResolverService } from './variable-resolver.service';

describe('VariableResolverService', () => {
  let service: VariableResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariableResolverService],
    }).compile();

    service = module.get<VariableResolverService>(VariableResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolvePath', () => {
    it('should resolve standard dot-notation path', () => {
      const obj = {
        nominatorId: {
          email: 'nominator@test.com',
          name: 'Nominator Name',
        },
      };
      expect(service.resolvePath(obj, 'nominatorId.email')).toBe('nominator@test.com');
      expect(service.resolvePath(obj, 'nominatorId.name')).toBe('Nominator Name');
    });

    it('should return null for non-existent path or null/undefined nodes', () => {
      const obj = {
        nominatorId: null,
        someOtherKey: undefined,
      };
      expect(service.resolvePath(obj, 'nominatorId.email')).toBeNull();
      expect(service.resolvePath(obj, 'someOtherKey.nested')).toBeNull();
      expect(service.resolvePath(obj, 'nonExistent')).toBeNull();
    });

    it('should implicitly map arrays, flatten results, and filter out falsy values', () => {
      const obj = {
        nominators: [
          { email: 'email1@test.com' },
          { email: null },
          { email: 'email2@test.com' },
          { other: 'no-email' },
        ],
      };
      expect(service.resolvePath(obj, 'nominators.email')).toEqual([
        'email1@test.com',
        'email2@test.com',
      ]);
    });

    it('should handle deeply nested arrays and flatten them completely', () => {
      const obj = {
        groups: [
          {
            members: [
              { email: 'email1@test.com' },
              { email: 'email2@test.com' },
            ],
          },
          {
            members: [
              { email: 'email3@test.com' },
            ],
          },
        ],
      };
      expect(service.resolvePath(obj, 'groups.members.email')).toEqual([
        'email1@test.com',
        'email2@test.com',
        'email3@test.com',
      ]);
    });
  });

  describe('interpolate', () => {
    it('should replace tokens with resolved values', () => {
      const obj = {
        registreeName: 'Vaibhav',
        event: {
          title: 'Annual Tech Summit',
        },
      };
      const template = 'Hello {{ registreeName }}, welcome to {{ event.title }}!';
      expect(service.interpolate(template, obj)).toBe(
        'Hello Vaibhav, welcome to Annual Tech Summit!',
      );
    });

    it('should replace tokens with comma-separated values if the resolved value is an array', () => {
      const obj = {
        nominators: [
          { email: 'email1@test.com' },
          { email: 'email2@test.com' },
        ],
      };
      const template = 'Send alerts to {{ nominators.email }}.';
      expect(service.interpolate(template, obj)).toBe(
        'Send alerts to email1@test.com, email2@test.com.',
      );
    });

    it('should replace empty string for unresolved paths', () => {
      const obj = {};
      const template = 'Value is {{ nonExistent }}.';
      expect(service.interpolate(template, obj)).toBe('Value is .');
    });

    it('should fallback to resolving without params. prefix if path starts with params. but context is flat', () => {
      const obj = {
        nominatorName: 'Vaibhav',
      };
      const template = 'Hello {{ params.nominatorName }}!';
      expect(service.interpolate(template, obj)).toBe('Hello Vaibhav!');
    });

    it('should fallback to resolving inside context.params if path has no params. prefix but context is nested', () => {
      const obj = {
        params: {
          nominatorName: 'Vaibhav',
        },
      };
      const template = 'Hello {{ nominatorName }}!';
      expect(service.interpolate(template, obj)).toBe('Hello Vaibhav!');
    });
  });
});
