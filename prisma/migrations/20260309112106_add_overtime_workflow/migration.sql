/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `overtime_requests` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `overtime_requests` table. All the data in the column will be lost.
  - Added the required column `requestedBy` to the `overtime_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add new workflow columns first (nullable requestedBy initially)
ALTER TABLE "overtime_requests" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
ADD COLUMN     "actualEndTime" TEXT,
ADD COLUMN     "actualHours" DOUBLE PRECISION,
ADD COLUMN     "actualStartTime" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "hrApprovedAt" TIMESTAMP(3),
ADD COLUMN     "hrApprovedBy" TEXT,
ADD COLUMN     "hrNote" TEXT,
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovedBy" TEXT,
ADD COLUMN     "managerNote" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectedStep" TEXT,
ADD COLUMN     "requestedBy" TEXT;

-- Backfill: Set requestedBy = userId for existing rows
UPDATE "overtime_requests" SET "requestedBy" = "userId" WHERE "requestedBy" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "overtime_requests" ALTER COLUMN "requestedBy" SET NOT NULL;
