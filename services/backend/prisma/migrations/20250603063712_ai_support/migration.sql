-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "achievabilityScore" DOUBLE PRECISION,
ADD COLUMN     "aiAnalysisSummary" TEXT,
ADD COLUMN     "aiReviewedAt" TIMESTAMP(3),
ADD COLUMN     "availableResources" TEXT,
ADD COLUMN     "currentExperience" TEXT,
ADD COLUMN     "startingPoint" TEXT,
ADD COLUMN     "weeklyTimeCommitment" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "suggestedByAI" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GoalEvaluation" (
    "id" SERIAL NOT NULL,
    "goalId" INTEGER NOT NULL,
    "realismScore" INTEGER NOT NULL,
    "summary" TEXT,
    "analysisDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalEvaluation_goalId_key" ON "GoalEvaluation"("goalId");

-- AddForeignKey
ALTER TABLE "GoalEvaluation" ADD CONSTRAINT "GoalEvaluation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
