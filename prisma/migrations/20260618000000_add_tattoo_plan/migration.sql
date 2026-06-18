-- CreateEnum
CREATE TYPE "TattooPlanStatus" AS ENUM ('DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TattooPlanSessionStatus" AS ENUM ('PENDING', 'LINK_SENT', 'BOOKED', 'COMPLETED');

-- CreateTable
CREATE TABLE "tattoo_plans" (
    "id" TEXT NOT NULL,
    "consultationAppointmentId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "status" "TattooPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tattoo_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tattoo_plan_sessions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "sessionLinkId" TEXT,
    "status" "TattooPlanSessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tattoo_plan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_plans_consultationAppointmentId_key" ON "tattoo_plans"("consultationAppointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_plan_sessions_sessionLinkId_key" ON "tattoo_plan_sessions"("sessionLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_plan_sessions_planId_sessionNumber_key" ON "tattoo_plan_sessions"("planId", "sessionNumber");

-- AddForeignKey
ALTER TABLE "tattoo_plans" ADD CONSTRAINT "tattoo_plans_consultationAppointmentId_fkey" FOREIGN KEY ("consultationAppointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tattoo_plan_sessions" ADD CONSTRAINT "tattoo_plan_sessions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "tattoo_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tattoo_plan_sessions" ADD CONSTRAINT "tattoo_plan_sessions_sessionLinkId_fkey" FOREIGN KEY ("sessionLinkId") REFERENCES "session_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
