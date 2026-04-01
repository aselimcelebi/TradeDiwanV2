-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "whatWentWell" TEXT,
    "toImprove" TEXT,
    "mood" INTEGER,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "imageUrls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_date_idx" ON "Trade"("date");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_idx" ON "JournalEntry"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_date_key" ON "JournalEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_name_key" ON "Strategy"("name");
