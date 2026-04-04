-- CreateTable
CREATE TABLE "OAuthCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refreshToken" TEXT,
    "updatedAt" DATETIME NOT NULL
);
