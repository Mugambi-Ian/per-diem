/*
  Warnings:

  - Added the required column `endTimeUtc` to the `ProductAvailability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTimeUtc` to the `ProductAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ProductAvailability" ADD COLUMN     "endTimeUtc" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTimeUtc" TIMESTAMP(3) NOT NULL;
