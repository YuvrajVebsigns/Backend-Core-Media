import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    resetPassword: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user validation fails', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);
      await expect(controller.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return login response if validation succeeds', async () => {
      const user = { userId: '1', email: 'test@example.com' };
      const loginResponse = { accessToken: 'at', refreshToken: 'rt', user: { id: '1', email: 'test@example.com', fullName: 'Test', role: 'STAFF' } };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login({ email: 'test@example.com', password: 'password' });
      expect(result).toEqual(loginResponse);
      expect(service.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
      expect(service.login).toHaveBeenCalledWith(user);
    });
  });
});
