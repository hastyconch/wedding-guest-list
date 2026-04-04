-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "priorityScore" REAL NOT NULL DEFAULT 0,
    "manualPriority" TEXT NOT NULL DEFAULT 'NICE_TO_HAVE',
    "groupId" TEXT,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "linkedGuestId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Guest_linkedGuestId_fkey" FOREIGN KEY ("linkedGuestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filterPreset" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScenarioGuest" (
    "scenarioId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "invited" BOOLEAN NOT NULL,

    PRIMARY KEY ("scenarioId", "guestId"),
    CONSTRAINT "ScenarioGuest_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScenarioGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScenarioGuest_scenarioId_idx" ON "ScenarioGuest"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioGuest_guestId_idx" ON "ScenarioGuest"("guestId");
