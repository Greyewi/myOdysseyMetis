import { Goal } from '@prisma/client'
import { type AIConfig } from '../agents'
import { evaluateGoalRealism as evalImpl } from '../agents/evaluation/service'
import { generateTasksForGoal as genTasksImpl } from '../agents/tasks/service'
import { suggestGoalRefinements as refineImpl } from '../agents/refinement/service'
import { analyzeGoalProgress as progressImpl } from '../agents/progress/service'
import { validateGoalCompletion as validateImpl } from '../agents/validation/service'
import { getGoalHistoricalInsights as insightsImpl } from '../agents/historical/service'

export type { AIConfig } from '../agents'

export interface GoalEvaluationResult {
  achievabilityScore: number
  summary: string
  analysisDetails: any
  historicalInsights?: any
  recommendations?: string[]
}

export async function evaluateGoalRealism(goal: Goal, customConfig?: AIConfig): Promise<GoalEvaluationResult> {
  return evalImpl(goal, customConfig)
}

export async function generateTasksForGoal(goal: Goal, customConfig?: AIConfig) {
  return genTasksImpl(goal, customConfig)
}

export async function suggestGoalRefinements(goal: Goal, customConfig?: AIConfig): Promise<string> {
  return refineImpl(goal, customConfig)
}

export async function analyzeGoalProgress(goal: Goal, tasks: any[], customConfig?: AIConfig): Promise<string> {
  return progressImpl(goal, tasks, customConfig)
}

export async function validateGoalCompletion(validationData: any, customConfig?: AIConfig) {
  return validateImpl(validationData, customConfig)
}

export async function getGoalHistoricalInsights(goal: Goal) {
  return insightsImpl(goal)
}
