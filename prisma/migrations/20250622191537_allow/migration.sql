-- DropForeignKey
ALTER TABLE "BillingRecord" DROP CONSTRAINT "BillingRecord_reservationId_fkey";

-- AlterTable
ALTER TABLE "BillingRecord" ALTER COLUMN "reservationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
