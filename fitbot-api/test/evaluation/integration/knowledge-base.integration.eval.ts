import { PrismaService } from '../../../src/prisma/prisma.service';
import { RagService } from '../../../src/rag/rag.service';
import { WidgetService } from '../../../src/widget/widget.service';
import { KnowledgeBaseService } from '../../../src/knowledge-base/knowledge-base.service';
import { EmbeddingService } from '../../../src/embedding/embedding.service';

const abstentionMessage = 'I could not find relevant information in the knowledge base to answer your question.';

function createWidgetHarness(prisma: PrismaService) {
  const provider = {
    generateResponse: jest.fn(async function* () {
      yield 'provider response';
    }),
  };
  const aiProviderService = { getProvider: jest.fn(() => provider) };
  const ragService = new RagService();
  const widget = new WidgetService(
    { createLog: jest.fn() } as any,
    { validate: jest.fn(async () => ({ results: [], hasBlockingError: false })) } as any,
    ragService,
    prisma,
    aiProviderService as any,
    { build: jest.fn(() => ({ source: 'test' })) } as any,
    { routeQuery: jest.fn(async () => ({ route: 'standard_search', confidence: 1 })) } as any,
    { search: jest.fn((query, _configId, chunks, topK) => ragService.search(query, chunks, topK)) } as any,
  );

  return { widget, provider };
}

async function collectChat(widget: WidgetService, configuration: any, query: string) {
  const values: Array<string | { explanation: unknown }> = [];
  for await (const value of widget.processChat(configuration, query, [])) {
    values.push(value);
  }
  return values;
}

describe('database-backed knowledge-base evaluation', () => {
  let prisma: PrismaService;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('fitbot_eval')) {
      throw new Error('This suite requires the disposable fitbot_eval database. Use npm run test:eval:integration.');
    }

    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (createdUserIds.length > 0) {
      const configurations = await prisma.configuration.findMany({
        where: { userId: { in: createdUserIds } },
        select: { id: true },
      });
      const configurationIds = configurations.map(({ id }) => id);
      const documents = await prisma.document.findMany({
        where: { configurationId: { in: configurationIds } },
        select: { id: true },
      });
      const documentIds = documents.map(({ id }) => id);

      await prisma.documentChunk.deleteMany({ where: { documentId: { in: documentIds } } });
      await prisma.document.deleteMany({ where: { id: { in: documentIds } } });
      await prisma.chatLog.deleteMany({ where: { configurationId: { in: configurationIds } } });
      await prisma.apiKey.deleteMany({ where: { configurationId: { in: configurationIds } } });
      await prisma.configuration.deleteMany({ where: { id: { in: configurationIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });

  async function createTenant(email: string, content: string) {
    const user = await prisma.user.create({
      data: {
        email,
        password: 'evaluation-only',
        configuration: {
          create: {
            faqText: '',
            aiProvider: 'openai',
            documents: {
              create: {
                fileName: `${email}.txt`,
                fileType: 'txt',
                content,
                chunks: { create: [{ content }] },
              },
            },
          },
        },
      },
      include: { configuration: true },
    });
    createdUserIds.push(user.id);
    return user;
  }

  it.each([
    'What is the Aurora locker code?',
    'Tell me the Aurora locker access code.',
  ])('does not retrieve another tenant for query: %s', async (query) => {
    const tenantA = await createTenant(`tenant-a-${Date.now()}-${Math.random()}@eval.test`, 'Aurora locker code is 1111.');
    const tenantB = await createTenant(`tenant-b-${Date.now()}-${Math.random()}@eval.test`, 'Borealis locker code is 9999.');
    const { widget, provider } = createWidgetHarness(prisma);

    await collectChat(widget, tenantA.configuration!, query);

    const providerCalls = provider.generateResponse.mock.calls as unknown as Array<[
      unknown,
      Array<{ role: string; content: string }>,
    ]>;
    const prompt = providerCalls[0][1][0].content;
    expect(prompt).toContain('Aurora locker code is 1111.');
    expect(prompt).not.toContain('Borealis locker code is 9999.');
    expect(tenantB.configuration!.id).not.toBe(tenantA.configuration!.id);
  });

  it('removes a document and its chunks from subsequent retrieval', async () => {
    const tenant = await createTenant(`tenant-delete-${Date.now()}-${Math.random()}@eval.test`, 'The cobalt recovery room opens at 06:30.');
    const document = await prisma.document.findFirstOrThrow({
      where: { configurationId: tenant.configuration!.id },
    });
    const { widget, provider } = createWidgetHarness(prisma);
    const knowledgeBase = new KnowledgeBaseService(prisma, new EmbeddingService());

    await collectChat(widget, tenant.configuration!, 'When does the cobalt recovery room open?');
    expect(provider.generateResponse).toHaveBeenCalledTimes(1);

    await knowledgeBase.deleteDocument(tenant.id, document.id);
    expect(await prisma.documentChunk.count({ where: { documentId: document.id } })).toBe(0);
    expect(await prisma.document.count({ where: { id: document.id } })).toBe(0);

    provider.generateResponse.mockClear();
    const values = await collectChat(widget, tenant.configuration!, 'When does the cobalt recovery room open?');
    expect(values).toContain(abstentionMessage);
    expect(provider.generateResponse).not.toHaveBeenCalled();
  });
});