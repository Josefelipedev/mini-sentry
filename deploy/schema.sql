-- Enums
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ErrorStatus" AS ENUM ('open', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PerfType" AS ENUM ('web_vital', 'http', 'navigation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PerfRating" AS ENUM ('good', 'needs_improvement', 'poor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT        NOT NULL,
  "email"        TEXT        NOT NULL,
  "passwordHash" TEXT        NOT NULL,
  "name"         TEXT,
  "role"         "UserRole"  NOT NULL DEFAULT 'member',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "allowedOrigins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "alertWebhookUrl" TEXT,
  "alertEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_apiKey_key" ON "Project"("apiKey");

CREATE TABLE IF NOT EXISTS "ErrorGroup" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "ErrorStatus" NOT NULL DEFAULT 'open',
  "environment" TEXT NOT NULL DEFAULT 'production',
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalOccurrences" INTEGER NOT NULL DEFAULT 1,
  "affectedUsers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "ErrorGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ErrorGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ErrorGroup_projectId_fingerprint_environment_key" ON "ErrorGroup"("projectId","fingerprint","environment");
CREATE INDEX IF NOT EXISTS "ErrorGroup_projectId_status_idx" ON "ErrorGroup"("projectId","status");
CREATE INDEX IF NOT EXISTS "ErrorGroup_projectId_lastSeenAt_idx" ON "ErrorGroup"("projectId","lastSeenAt");
CREATE INDEX IF NOT EXISTS "ErrorGroup_projectId_totalOccurrences_idx" ON "ErrorGroup"("projectId","totalOccurrences");

CREATE TABLE IF NOT EXISTS "ErrorEvent" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sessionId" TEXT,
  "userId" TEXT,
  "url" TEXT,
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "desminifiedStack" TEXT,
  "browser" JSONB,
  "breadcrumbs" JSONB,
  "metadata" JSONB,
  "environment" TEXT NOT NULL DEFAULT 'production',
  "version" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ErrorEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ErrorEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ErrorGroup"("id") ON DELETE CASCADE,
  CONSTRAINT "ErrorEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ErrorEvent_groupId_createdAt_idx" ON "ErrorEvent"("groupId","createdAt");
CREATE INDEX IF NOT EXISTS "ErrorEvent_projectId_createdAt_idx" ON "ErrorEvent"("projectId","createdAt");
CREATE INDEX IF NOT EXISTS "ErrorEvent_userId_idx" ON "ErrorEvent"("userId");

CREATE TABLE IF NOT EXISTS "SourceMap" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceMap_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SourceMap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SourceMap_projectId_version_filename_key" ON "SourceMap"("projectId","version","filename");
CREATE INDEX IF NOT EXISTS "SourceMap_projectId_version_idx" ON "SourceMap"("projectId","version");

CREATE TABLE IF NOT EXISTS "PerformanceEvent" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sessionId" TEXT,
  "url" TEXT,
  "type" "PerfType" NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "rating" "PerfRating" NOT NULL,
  "version" VARCHAR(100),
  "environment" VARCHAR(50) NOT NULL DEFAULT 'production',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerformanceEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PerformanceEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PerformanceEvent_projectId_createdAt_idx" ON "PerformanceEvent"("projectId","createdAt");
CREATE INDEX IF NOT EXISTS "PerformanceEvent_projectId_type_name_idx" ON "PerformanceEvent"("projectId","type","name");
