-- Add structured retrieval telemetry field to ChatLog (Task 3.7 / Phase 1).
ALTER TABLE "ChatLog" ADD COLUMN "retrieval" JSONB;
