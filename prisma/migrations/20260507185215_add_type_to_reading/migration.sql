-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'tarot',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "exchangesUsed" INTEGER NOT NULL DEFAULT 0,
    "exchangesTotal" INTEGER NOT NULL DEFAULT 10,
    "transcript" TEXT,
    "cardsDrawn" TEXT,
    "spread" TEXT,
    "question" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingSession_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ReadingSession" ("cardsDrawn", "completedAt", "createdAt", "exchangesTotal", "exchangesUsed", "id", "purchaseId", "question", "spread", "status", "transcript", "userId") SELECT "cardsDrawn", "completedAt", "createdAt", "exchangesTotal", "exchangesUsed", "id", "purchaseId", "question", "spread", "status", "transcript", "userId" FROM "ReadingSession";
DROP TABLE "ReadingSession";
ALTER TABLE "new_ReadingSession" RENAME TO "ReadingSession";
CREATE UNIQUE INDEX "ReadingSession_purchaseId_key" ON "ReadingSession"("purchaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
