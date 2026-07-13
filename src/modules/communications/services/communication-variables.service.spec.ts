import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommunicationVariablesService } from './communication-variables.service';
import {
  CommunicationVariable,
  VariableCategoryGroup,
} from '../schemas/communication-variable.schema';

describe('CommunicationVariablesService Unit Tests', () => {
  let service: CommunicationVariablesService;

  const mockVariable = {
    id: 'var123',
    name: 'Registree Name',
    path: 'registreeName',
    type: 'String',
    isArray: false,
    modelName: 'Registree',
    categoryGroup: VariableCategoryGroup.REGISTRATION,
    description: 'The registrant full name',
    isActive: true,
    isDeleted: null,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockModelInstance = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({
        id: 'new123',
        ...dto,
      }),
    };
  });

  const mockVariableModel: any = mockModelInstance;
  mockVariableModel.find = jest.fn();
  mockVariableModel.findOne = jest.fn();
  mockVariableModel.countDocuments = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationVariablesService,
        {
          provide: getModelToken(CommunicationVariable.name),
          useValue: mockVariableModel,
        },
      ],
    }).compile();

    service = module.get<CommunicationVariablesService>(
      CommunicationVariablesService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new variable', async () => {
      const dto = {
        name: 'New Var',
        path: 'newVar',
        type: 'String',
        modelName: 'Registree',
        categoryGroup: VariableCategoryGroup.REGISTRATION,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.path).toBe('newVar');
    });

    it('should throw ConflictException on duplicate key index errors', async () => {
      const dto = {
        name: 'New Var',
        path: 'newVar',
        type: 'String',
        modelName: 'Registree',
        categoryGroup: VariableCategoryGroup.REGISTRATION,
      };

      mockModelInstance.mockImplementationOnce(() => {
        return {
          save: jest.fn().mockRejectedValue({ code: 11000 }),
        };
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should retrieve a single active variable document', async () => {
      mockVariableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVariable),
      });

      const result = await service.findOne('var123');
      expect(result).toBeDefined();
      expect(result.id).toBe('var123');
      expect(mockVariableModel.findOne).toHaveBeenCalledWith({
        _id: 'var123',
        isDeleted: null,
      });
    });

    it('should throw NotFoundException if variable does not exist', async () => {
      mockVariableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered variables list', async () => {
      const mockList = [mockVariable];
      mockVariableModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockList),
      });
      mockVariableModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'Registree',
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
