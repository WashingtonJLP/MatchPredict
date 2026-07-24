/*
  Warnings:

  - A unique constraint covering the columns `[league_id,year]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `seasons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "seasons_league_id_year_key" ON "seasons"("league_id", "year");
