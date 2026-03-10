-- AlterTable
ALTER TABLE "shift_assignments" ADD COLUMN     "cycleStartDate" DATE,
ADD COLUMN     "workCycleId" TEXT,
ALTER COLUMN "shiftId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_workCycleId_fkey" FOREIGN KEY ("workCycleId") REFERENCES "work_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
