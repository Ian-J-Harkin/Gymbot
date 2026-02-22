import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Security & Integration (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Match the main.ts setup for CORS exactly
    app.enableCors({
      origin: ['http://localhost:5173'], // Our known dev react-demo origin
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── CORS Testing ────────────────────────────────────────────────────────
  describe('CORS Restrictions', () => {
    it('should allow requests from permitted origin', () => {
      return request(app.getHttpServer())
        .options('/api/widget/config')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'http://localhost:5173');
    });

    it('should block requests from unauthorized origin via mismatch', () => {
      return request(app.getHttpServer())
        .options('/api/widget/config')
        .set('Origin', 'http://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204)
        .then(res => {
          // When CORS blocks an origin in Express/Nest, it intentionally omits the ACAO header
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  // ─── Authentication Testing ──────────────────────────────────────────────
  describe('API Key Guard', () => {
    it('should block access without X-API-Key header', () => {
      return request(app.getHttpServer())
        .get('/api/widget/config')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toEqual('Missing API Key');
        });
    });

    it('should block access with invalid API key', () => {
      return request(app.getHttpServer())
        .get('/api/widget/config')
        .set('X-API-Key', 'invalid-key-999')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid API Key');
        });
    });

    it('should permit access with valid seeded demo API key', () => {
      return request(app.getHttpServer())
        .get('/api/widget/config')
        .set('X-API-Key', 'demo-api-key-123') // This is seeded by Prisma
        .expect(200);
    });
  });

  // ─── Rate Limiting Testing ───────────────────────────────────────────────
  describe('Rate Limiting (Throttler)', () => {
    it('should enforce limits by returning 429 after bursting config endpoint', async () => {
      // The global Throttler limit in app.module.ts is 100 per minute.
      // Send >100 valid requests
      const REQ_LIMIT = 105;
      let got429 = false;

      // Sequential iteration to cleanly trip the limit instead of concurrent socket crashes
      for (let i = 0; i < REQ_LIMIT; i++) {
        const res = await request(app.getHttpServer()).get('/api/widget/config').set('X-API-Key', 'demo-api-key-123');
        if (res.status === 429) {
          got429 = true;
          break;
        }
      }

      expect(got429).toBe(true);
    });
  });
});
