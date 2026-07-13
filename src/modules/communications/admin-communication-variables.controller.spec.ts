import { Test, TestingModule } from '@nestjs/testing';
import { AdminCommunicationVariablesController } from './admin-communication-variables.controller';
import { CommunicationVariablesService } from './services/communication-variables.service';
import { VariableCategoryGroup } from './schemas/communication-variable.schema';

describe('AdminCommunicationVariablesController Unit Tests', () => {
  let controller: AdminCommunicationVariablesController;
  let service: CommunicationVariablesService;

  const mockService = {
    create: jest
      .fn()
      .mockImplementation((dto) => Promise.resolve({ id: '1', ...dto })),
    findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    findOne: jest
      .fn()
      .mockImplementation((id) => Promise.resolve({ id, name: 'Test' })),
    update: jest
      .fn()
      .mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
    remove: jest
      .fn()
      .mockImplementation((id) =>
        Promise.resolve({ id, isDeleted: new Date() }),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCommunicationVariablesController],
      providers: [
        {
          provide: CommunicationVariablesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminCommunicationVariablesController>(
      AdminCommunicationVariablesController,
    );
    service = module.get<CommunicationVariablesService>(
      CommunicationVariablesService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should forward create payload to the service', async () => {
      const dto = {
        name: 'Var',
        path: 'var',
        type: 'String',
        modelName: 'Registree',
        categoryGroup: VariableCategoryGroup.REGISTRATION,
      };

      const result = await controller.create(dto);
      expect(result.name).toBe('Var');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should forward search query params to the service', async () => {
      const query = { page: 1, limit: 10, search: 'Test' };
      const result = await controller.findAll(query);
      expect(result).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should retrieve a variable by ID from the service', async () => {
      const result = await controller.findOne('123');
      expect(result.id).toBe('123');
      expect(service.findOne).toHaveBeenCalledWith('123');
    });
  });

  describe('update', () => {
    it('should forward update modifications to the service', async () => {
      const dto = { name: 'Updated name' };
      const result = await controller.update('123', dto);
      expect(result.name).toBe('Updated name');
      expect(service.update).toHaveBeenCalledWith('123', dto);
    });
  });

  describe('remove', () => {
    it('should trigger deletion call via the service', async () => {
      const result = await controller.remove('123');
      expect(result.id).toBe('123');
      expect(service.remove).toHaveBeenCalledWith('123');
    });
  });
});
