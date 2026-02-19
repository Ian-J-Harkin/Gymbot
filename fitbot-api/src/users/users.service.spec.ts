
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find a user', async () => {
      const user = { id: '1', email: 'test@example.com' };
      prismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('test@example.com');
      expect(result).toEqual(user);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password',
        gymName: 'Test Gym',
        recaptchaToken: 'token'
      };
      const user = {
        id: '2',
        email: 'new@example.com',
        password: 'hashed',
        gymName: 'Test Gym'
      };

      prismaService.user.create.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed'));

      const result = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'hashed',
          gymName: 'Test Gym'
        },
      });
      expect(result).toEqual(user);
    });
  });
});
