/*
  Warnings:

  - You are about to drop the column `endTimeUtc` on the `ProductAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `startTimeUtc` on the `ProductAvailability` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProductAvailability" DROP COLUMN "endTimeUtc",
DROP COLUMN "startTimeUtc";
