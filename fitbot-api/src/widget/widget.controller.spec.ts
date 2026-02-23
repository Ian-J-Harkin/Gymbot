
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('WidgetController', () => {
  let controller: WidgetController;
  let service: Partial<WidgetService>;

  beforeEach(async () => {
    service = {
      getPublicConfig: jest.fn(),
      processChat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [WidgetController],
      providers: [{ provide: WidgetService, useValue: service }],
    })
      .overrideGuard(ApiKeyAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WidgetController>(WidgetController);
  });

  describe('getConfig', () => {
    it('should return public config', async () => {
      const result = { widgetColor: '#000', greetingMessage: 'Hi' };
      (service.getPublicConfig as jest.Mock).mockReturnValue(result);

      const req = { configuration: { id: 'config-1' } } as any;
      expect(controller.getConfig(req)).toBe(result);
      expect(service.getPublicConfig).toHaveBeenCalledWith(req.configuration);
    });
  });

  describe('chat', () => {
    it('should stream response', async () => {
      const req = { configuration: { id: 'config-1' } } as any;
      const body = { message: 'hello', history: [] };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as any;

      async function* mockGenerator() {
        yield 'chunk1';
        yield 'chunk2';
        yield { explanation: { provider: 'test' } };
      }

      (service.processChat as jest.Mock).mockReturnValue(mockGenerator());

      await controller.chat(req, body, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.write).toHaveBeenCalledWith('data: {"content":"chunk1"}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"content":"chunk2"}\n\n');
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('explanation'));
      expect(res.write).toHaveBeenCalledWith('data: [DONE]\n\n');
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle errors during streaming', async () => {
      const req = { configuration: { id: 'config-1' } } as any;
      const body = { message: 'error', history: [] };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as any;

      (service.processChat as jest.Mock).mockImplementation(() => {
        throw new Error('Stream error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.chat(req, body, res);

      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('encountered an error'));
      expect(res.write).toHaveBeenCalledWith('data: [DONE]\n\n');
      expect(res.end).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
