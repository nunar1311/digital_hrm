-- CreateTable
CREATE TABLE "work_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_cycle_entries" (
    "id" TEXT NOT NULL,
    "workCycleId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "shiftId" TEXT,
    "isDayOff" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "work_cycle_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_cycle_entries_workCycleId_dayIndex_key" ON "work_cycle_entries"("workCycleId", "dayIndex");

-- AddForeignKey
ALTER TABLE "work_cycle_entries" ADD CONSTRAINT "work_cycle_entries_workCycleId_fkey" FOREIGN KEY ("workCycleId") REFERENCES "work_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_cycle_entries" ADD CONSTRAINT "work_cycle_entries_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
