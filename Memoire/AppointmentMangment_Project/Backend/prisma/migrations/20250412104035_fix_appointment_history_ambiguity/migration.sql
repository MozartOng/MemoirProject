/*
  Warnings:

  - You are about to drop the column `changed_at` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `new_date` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `new_time` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `old_date` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `old_status` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `old_time` on the `AppointmentHistory` table. All the data in the column will be lost.
  - You are about to drop the column `file_name` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `File` table. All the data in the column will be lost.
  - Added the required column `previous_status` to the `AppointmentHistory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `new_status` on the `AppointmentHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `file_type` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentHistory" DROP CONSTRAINT "AppointmentHistory_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentHistory" DROP CONSTRAINT "AppointmentHistory_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_appointment_id_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "visit_description" TEXT,
ADD COLUMN     "workshop_detail" TEXT;

-- AlterTable
ALTER TABLE "AppointmentHistory" DROP COLUMN "changed_at",
DROP COLUMN "new_date",
DROP COLUMN "new_time",
DROP COLUMN "old_date",
DROP COLUMN "old_status",
DROP COLUMN "old_time",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "previous_status" TEXT NOT NULL,
DROP COLUMN "new_status",
ADD COLUMN     "new_status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "file_name",
DROP COLUMN "uploaded_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "file_type" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
