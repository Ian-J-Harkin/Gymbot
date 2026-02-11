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
});
