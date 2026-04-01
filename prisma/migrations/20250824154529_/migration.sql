-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "server" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "currency" TEXT DEFAULT 'USD',
    "leverage" INTEGER,
    "company" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Broker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT,
    "date" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL NOT NULL,
    "fees" REAL NOT NULL DEFAULT 0,
    "risk" REAL,
    "strategy" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("createdAt", "date", "entryPrice", "exitPrice", "fees", "id", "imageUrl", "notes", "qty", "risk", "side", "strategy", "symbol", "tags", "updatedAt", "userId") SELECT "createdAt", "date", "entryPrice", "exitPrice", "fees", "id", "imageUrl", "notes", "qty", "risk", "side", "strategy", "symbol", "tags", "updatedAt", "userId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX "Trade_brokerId_idx" ON "Trade"("brokerId");
CREATE INDEX "Trade_date_idx" ON "Trade"("date");
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Broker_userId_idx" ON "Broker"("userId");

-- CreateIndex
CREATE INDEX "Broker_platform_idx" ON "Broker"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_userId_accountId_platform_key" ON "Broker"("userId", "accountId", "platform");
