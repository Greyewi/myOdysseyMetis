-- CreateEnum
CREATE TYPE "GoalDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'HARDCORE');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "difficulty" "GoalDifficulty" NOT NULL DEFAULT 'EASY';
