
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RecaptchaService } from './recaptcha.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let recaptchaService: Partial<RecaptchaService>;

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
    };
    recaptchaService = {
      verify: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RecaptchaService, useValue: recaptchaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if validation succeeds', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        gymName: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        stripeSubscriptionId: null
      };
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        gymName: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        stripeSubscriptionId: null
      });
    });

    it('should return null if validation fails', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        gymName: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        stripeSubscriptionId: null
      };
      (usersService.findOne as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        gymName: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        stripeSubscriptionId: null
      };
      const result = await service.login(user);
      expect(result).toEqual({
        access_token: 'token',
        user: {
          id: user.id,
          email: user.email,
          gymName: user.gymName,
          createdAt: undefined,
          subscriptionStatus: user.subscriptionStatus,
        }
      });

      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id });
    });
  });

  describe('register', () => {
    it('should create user and return token', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password',
        recaptchaToken: 'valid-token'
      };
      const createdUser = {
        id: '2',
        email: 'new@example.com',
        password: 'hashed',
        gymName: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        stripeSubscriptionId: null
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        access_token: 'token',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          gymName: null,
          createdAt: undefined,
          subscriptionStatus: null,
        }
      });
      expect(recaptchaService.verify).toHaveBeenCalledWith('valid-token');
    });
  });
});
