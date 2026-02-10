-- AlterTable
ALTER TABLE "Configuration" ADD COLUMN     "aiProvider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "ollamaModel" TEXT DEFAULT 'llama3',
ADD COLUMN     "ollamaUrl" TEXT DEFAULT 'http://localhost:11434',
ADD COLUMN     "openRouterApiKey" TEXT,
ALTER COLUMN "openAiApiKey" DROP NOT NULL;
