-- CreateTable
CREATE TABLE "Fill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "symbolRaw" TEXT NOT NULL,
    "symbolNorm" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "price" REAL NOT NULL,
    "feeAmt" REAL NOT NULL,
    "feeCcy" TEXT NOT NULL,
    "ts" DATETIME NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fill_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PositionLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "symbolNorm" TEXT NOT NULL,
    "sideDir" TEXT NOT NULL,
    "openTs" DATETIME NOT NULL,
    "avgEntry" REAL NOT NULL,
    "qtyOpen" REAL NOT NULL,
    "realizedPnlAccum" REAL NOT NULL DEFAULT 0,
    "feesAccum" REAL NOT NULL DEFAULT 0,
    "fundingAccum" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PositionLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PositionLedger_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RealizedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "symbolNorm" TEXT NOT NULL,
    "sideDir" TEXT NOT NULL,
    "openTs" DATETIME NOT NULL,
    "closeTs" DATETIME NOT NULL,
    "qtyClosed" REAL NOT NULL,
    "avgEntryUsed" REAL NOT NULL,
    "avgExitUsed" REAL NOT NULL,
    "realizedPnl" REAL NOT NULL,
    "feesTotal" REAL NOT NULL,
    "fundingTotal" REAL NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RealizedEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RealizedEvent_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundingFee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "symbolNorm" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "ts" DATETIME NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundingFee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundingFee_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL,
    "fillsImported" INTEGER NOT NULL DEFAULT 0,
    "eventsGenerated" INTEGER NOT NULL DEFAULT 0,
    "fundingImported" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorLog" TEXT
);

-- CreateIndex
CREATE INDEX "Fill_userId_idx" ON "Fill"("userId");

-- CreateIndex
CREATE INDEX "Fill_brokerId_idx" ON "Fill"("brokerId");

-- CreateIndex
CREATE INDEX "Fill_symbolNorm_idx" ON "Fill"("symbolNorm");

-- CreateIndex
CREATE INDEX "Fill_ts_idx" ON "Fill"("ts");

-- CreateIndex
CREATE UNIQUE INDEX "Fill_sourceKey_source_brokerId_key" ON "Fill"("sourceKey", "source", "brokerId");

-- CreateIndex
CREATE INDEX "PositionLedger_userId_idx" ON "PositionLedger"("userId");

-- CreateIndex
CREATE INDEX "PositionLedger_brokerId_idx" ON "PositionLedger"("brokerId");

-- CreateIndex
CREATE INDEX "PositionLedger_symbolNorm_idx" ON "PositionLedger"("symbolNorm");

-- CreateIndex
CREATE UNIQUE INDEX "PositionLedger_userId_brokerId_symbolNorm_sideDir_key" ON "PositionLedger"("userId", "brokerId", "symbolNorm", "sideDir");

-- CreateIndex
CREATE INDEX "RealizedEvent_userId_idx" ON "RealizedEvent"("userId");

-- CreateIndex
CREATE INDEX "RealizedEvent_brokerId_idx" ON "RealizedEvent"("brokerId");

-- CreateIndex
CREATE INDEX "RealizedEvent_symbolNorm_idx" ON "RealizedEvent"("symbolNorm");

-- CreateIndex
CREATE INDEX "RealizedEvent_dayBucket_idx" ON "RealizedEvent"("dayBucket");

-- CreateIndex
CREATE INDEX "RealizedEvent_closeTs_idx" ON "RealizedEvent"("closeTs");

-- CreateIndex
CREATE INDEX "FundingFee_userId_idx" ON "FundingFee"("userId");

-- CreateIndex
CREATE INDEX "FundingFee_brokerId_idx" ON "FundingFee"("brokerId");

-- CreateIndex
CREATE INDEX "FundingFee_symbolNorm_idx" ON "FundingFee"("symbolNorm");

-- CreateIndex
CREATE INDEX "FundingFee_dayBucket_idx" ON "FundingFee"("dayBucket");

-- CreateIndex
CREATE INDEX "FundingFee_ts_idx" ON "FundingFee"("ts");

-- CreateIndex
CREATE INDEX "ImportSession_userId_idx" ON "ImportSession"("userId");

-- CreateIndex
CREATE INDEX "ImportSession_brokerId_idx" ON "ImportSession"("brokerId");

-- CreateIndex
CREATE INDEX "ImportSession_status_idx" ON "ImportSession"("status");
