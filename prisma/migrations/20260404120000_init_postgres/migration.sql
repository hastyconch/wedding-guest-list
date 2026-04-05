-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GuestCategory" AS ENUM ('IMMEDIATE_FAMILY', 'FAMILY_FRIENDS', 'FRIENDS', 'PLUS_ONE');

-- CreateEnum
CREATE TYPE "GuestSide" AS ENUM ('RIA', 'SUNNY', 'BOTH');

-- CreateEnum
CREATE TYPE "ManualPriority" AS ENUM ('MUST_INVITE', 'NICE_TO_HAVE', 'CUT_IF_NEEDED');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "category" "GuestCategory" NOT NULL,
    "side" "GuestSide" NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualPriority" "ManualPriority" NOT NULL DEFAULT 'NICE_TO_HAVE',
    "groupId" TEXT,
    "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "linkedGuestId" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filterPreset" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioGuest" (
    "scenarioId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "invited" BOOLEAN NOT NULL,

    CONSTRAINT "ScenarioGuest_pkey" PRIMARY KEY ("scenarioId","guestId")
);

-- CreateTable
CREATE TABLE "OAuthCredential" (
    "id" TEXT NOT NULL,
    "refreshToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScenarioGuest_scenarioId_idx" ON "ScenarioGuest"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioGuest_guestId_idx" ON "ScenarioGuest"("guestId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_linkedGuestId_fkey" FOREIGN KEY ("linkedGuestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioGuest" ADD CONSTRAINT "ScenarioGuest_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioGuest" ADD CONSTRAINT "ScenarioGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
