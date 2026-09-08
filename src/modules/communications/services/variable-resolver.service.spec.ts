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
      expect(service.resolvePath(obj, 'nominatorId.email')).toBe(
        'nominator@test.com',
      );
      expect(service.resolvePath(obj, 'nominatorId.name')).toBe(
        'Nominator Name',
      );
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
            members: [{ email: 'email3@test.com' }],
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
      const template =
        'Hello {{ registreeName }}, welcome to {{ event.title }}!';
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

    it('should render block loop iteration {{#each nominees}} with inner properties and index', () => {
      const context = {
        nominatorName: 'John Doe',
        nominees: [
          {
            name: 'Jane Smith',
            company: 'Infosys',
            category: 'CIO of the Year',
          },
          { name: 'Bob Jones', company: 'Wipro', category: 'Cloud Innovation' },
        ],
      };
      const template =
        'Nominator: {{nominatorName}}\n' +
        '{{#each nominees}}\n' +
        '#{{index}}: {{name}} ({{company}}) - {{category}}\n' +
        '{{/each}}';

      const result = service.interpolate(template, context);
      expect(result).toContain('Nominator: John Doe');
      expect(result).toContain('#1: Jane Smith (Infosys) - CIO of the Year');
      expect(result).toContain('#2: Bob Jones (Wipro) - Cloud Innovation');
    });

    it('should support {{#each params.nominees}} when data is in params', () => {
      const context = {
        params: {
          nominees: [
            { name: 'Alice', category: 'Security' },
            { name: 'Charlie', category: 'DevOps' },
          ],
        },
      };
      const template =
        '{{#each params.nominees}}[{{name}} - {{category}}]{{/each}}';
      expect(service.interpolate(template, context)).toBe(
        '[Alice - Security][Charlie - DevOps]',
      );
    });

    it('should format array of objects cleanly without [object Object] when referenced as a single token', () => {
      const context = {
        nominees: [
          { name: 'Alice', category: 'Security' },
          { name: 'Charlie', category: 'DevOps' },
        ],
      };
      const template = 'Nominees: {{nominees}}';
      expect(service.interpolate(template, context)).toBe(
        'Nominees: Alice (Security), Charlie (DevOps)',
      );
    });

    it('should prefer nomineesTable if available when {{nominees}} is referenced directly', () => {
      const context = {
        nominees: [{ name: 'Alice' }],
        nomineesTable: '<table><tr><td>Alice</td></tr></table>',
      };
      const template = 'Summary: {{nominees}}';
      expect(service.interpolate(template, context)).toBe(
        'Summary: <table><tr><td>Alice</td></tr></table>',
      );
    });

    it('should render Brevo {% for nominee in params.nominees %} loop with {{ nominee.prop }} and {% if %}', () => {
      const context = {
        params: {
          nominees: [
            {
              index: 1,
              name: 'yuvraj shete',
              company: 'vebsigns',
              category: 'CIO Choice',
              subCategory: 'Cloud Platform',
              email: 'yuvraj@vebsigns.com',
            },
            {
              index: 2,
              name: 'Jane Doe',
              company: 'Acme Corp',
              category: 'Innovation',
              subCategory: '',
              email: 'jane@acme.com',
            },
          ],
        },
      };

      const template =
        '{% for nominee in params.nominees %}\n' +
        'Vendor #{{ nominee.index }}: {{ nominee.company }} - {{ nominee.category }}\n' +
        '{% if nominee.subCategory %}Sub: {{ nominee.subCategory }}\n{% endif %}' +
        'Contact: {{ nominee.name }} ({{ nominee.email }})\n' +
        '{% endfor %}';

      const result = service.interpolate(template, context);
      expect(result).toContain('Vendor #1: vebsigns - CIO Choice');
      expect(result).toContain('Sub: Cloud Platform');
      expect(result).toContain('Contact: yuvraj shete (yuvraj@vebsigns.com)');
      expect(result).toContain('Vendor #2: Acme Corp - Innovation');
      expect(result).not.toContain('Sub: \nContact: Jane Doe');
      expect(result).toContain('Contact: Jane Doe (jane@acme.com)');
      expect(result).not.toContain('{% for');
      expect(result).not.toContain('{% endfor');
      expect(result).not.toContain('{% if');
    });

    it('should support {{ for nominee in nominees }} with double-brace syntax as fallback', () => {
      const context = {
        nominees: [{ name: 'Alice', company: 'Wonderland' }],
      };
      const template =
        '{{ for nominee in nominees }}{{ nominee.name }} at {{ nominee.company }}{{ endfor }}';
      expect(service.interpolate(template, context)).toBe(
        'Alice at Wonderland',
      );
    });

    it('should prioritize nominatorSnapshot values when resolving nominatorId.* paths', () => {
      const context = {
        nominatorSnapshot: {
          name: 'Snapshot Name',
          email: 'snapshot@test.com',
          company: 'Snapshot Company',
          phone: '9999999999',
          city: 'Snapshot City',
        },
        nominatorId: {
          name: 'Old CRM Name',
          email: 'crm@test.com',
          organization: 'Old CRM Org',
          phoneNumber: '1111111111',
          city: 'Old City',
        },
      };

      expect(service.resolveVariable(context, 'nominatorId.name')).toBe(
        'Snapshot Name',
      );
      expect(service.resolveVariable(context, 'nominatorId.email')).toBe(
        'snapshot@test.com',
      );
      expect(service.resolveVariable(context, 'nominatorId.organization')).toBe(
        'Snapshot Company',
      );
      expect(service.resolveVariable(context, 'nominatorId.phoneNumber')).toBe(
        '9999999999',
      );
      expect(service.resolveVariable(context, 'nominatorId.city')).toBe(
        'Snapshot City',
      );

      const template =
        'Nominator: {{ nominatorId.name }} from {{ nominatorId.organization }} ({{ nominatorId.email }})';
      expect(service.interpolate(template, context)).toBe(
        'Nominator: Snapshot Name from Snapshot Company (snapshot@test.com)',
      );
    });

    it('should resolve nominatorSnapshot.* directly and fallback to nominatorId on legacy records', () => {
      const legacyContext = {
        nominatorId: {
          name: 'Legacy Nominator',
          email: 'legacy@test.com',
          organization: 'Legacy Org',
          phoneNumber: '5555555555',
          city: 'Legacy City',
        },
      };

      expect(
        service.resolveVariable(legacyContext, 'nominatorSnapshot.name'),
      ).toBe('Legacy Nominator');
      expect(
        service.resolveVariable(legacyContext, 'nominatorSnapshot.email'),
      ).toBe('legacy@test.com');
      expect(
        service.resolveVariable(legacyContext, 'nominatorSnapshot.company'),
      ).toBe('Legacy Org');
      expect(
        service.resolveVariable(legacyContext, 'nominatorSnapshot.phone'),
      ).toBe('5555555555');
      expect(
        service.resolveVariable(legacyContext, 'nominatorSnapshot.city'),
      ).toBe('Legacy City');
    });
  });
});
