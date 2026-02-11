import { Test, TestingModule } from '@nestjs/testing';
import { ChatLogsService } from './chat-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatLogsService', () => {
    let service: ChatLogsService;
    let prismaService: any;

    beforeEach(async () => {
        prismaService = {
            chatLog: {
                create: jest.fn().mockResolvedValue({
                    id: 'test-log-id',
                    configurationId: 'config-1',
                    userMessage: 'hello',
                    aiResponse: 'hi',
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    contextLength: 100,
                    validationFlags: [],
                    responseTimeMs: 500,
                    createdAt: new Date(),
                }),
            } as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatLogsService,
                { provide: PrismaService, useValue: prismaService },
            ],
        }).compile();

        service = module.get<ChatLogsService>(ChatLogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createLog', () => {
        it('should create a chat log entry', async () => {
            const logData = {
                configurationId: 'config-1',
                userMessage: 'hello',
                aiResponse: 'hi',
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                contextLength: 100,
                validationFlags: [],
                responseTimeMs: 500,
            };

            const result = await service.createLog(logData);

            expect(prismaService.chatLog?.create).toHaveBeenCalledWith({
                data: {
                    configuration: { connect: { id: 'config-1' } },
                    userMessage: 'hello',
                    aiResponse: 'hi',
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                    contextLength: 100,
                    validationFlags: [],
                    responseTimeMs: 500,
                },
            });
            expect(result).toHaveProperty('id', 'test-log-id');
        });
    });

    describe('findByUserId', () => {
        it('should return logs for a specific user', async () => {
            const mockLogs = [{ id: 'log-1' }, { id: 'log-2' }];
            prismaService.chatLog.findMany = jest.fn().mockResolvedValue(mockLogs);

            const result = await service.findByUserId('user-1');

            expect(prismaService.chatLog.findMany).toHaveBeenCalledWith({
                where: {
                    configuration: {
                        userId: 'user-1'
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            expect(result).toEqual(mockLogs);
        });
    });
});
