
import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      configuration: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      apiKey: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create config if missing and return new key', async () => {
      prismaService.configuration.findUnique.mockResolvedValue(null);
      const createdConfig = { id: 'conf1', userId: 'user1' };
      prismaService.configuration.create.mockResolvedValue(createdConfig);

      const apiKeyRecord = { key: 'newKey' };
      prismaService.apiKey.upsert.mockResolvedValue(apiKeyRecord);

      const result = await service.createApiKey('user1');

      expect(prismaService.configuration.create).toHaveBeenCalled();
      expect(prismaService.apiKey.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { configurationId: 'conf1' },
        create: expect.objectContaining({ configurationId: 'conf1' }),
      }));
      expect(result).toEqual({ apiKey: 'newKey' });
    });

    it('should use existing config and return new key', async () => {
      const config = { id: 'conf1', userId: 'user1' };
      prismaService.configuration.findUnique.mockResolvedValue(config);

      const apiKeyRecord = { key: 'newKey' };
      prismaService.apiKey.upsert.mockResolvedValue(apiKeyRecord);

      const result = await service.createApiKey('user1');

      expect(prismaService.configuration.create).not.toHaveBeenCalled();
      expect(prismaService.apiKey.upsert).toHaveBeenCalled();
      expect(result).toEqual({ apiKey: 'newKey' });
    });
  });
});
