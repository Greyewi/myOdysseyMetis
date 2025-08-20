import { Goal } from '@prisma/client'
import type { AIConfig } from '../baseAgent'
import { createGoalRefinementAgent } from '../refinement/agent'
import { historicalAnalysisService } from '../../services/historical-analysis.service'

function formatHistoricalInsightsForAI(insights: any): string {
  if (!insights || insights.totalSimilarGoals === 0) {
    return 'No historical data available for similar goals.'
  }
  return `\n${insights.totalSimilarGoals} similar goals analyzed. Historical success rate: ${Math.round(insights.successRate * 100)}%.`
}

export async function suggestGoalRefinements(goal: Goal, customConfig?: AIConfig): Promise<string> {
  const historicalInsights = await historicalAnalysisService.analyzeHistoricalInsights(goal)
  const agent = createGoalRefinementAgent(customConfig)

  const refinementPrompt = `Please analyze the following goal and suggest improvements based on SMART criteria and historical data:\n\n**Current Goal:**\n- Title: ${goal.title}\n- Description: ${goal.description}\n- Category: ${(goal as any).category}\n- Deadline: ${goal.deadline.toISOString()}\n- Weekly Time Commitment: ${(goal as any).weeklyTimeCommitment || 'not specified'}\n- Current Experience: ${(goal as any).currentExperience || 'not specified'}\n- Available Resources: ${(goal as any).availableResources || 'not specified'}\n- Starting Point: ${(goal as any).startingPoint || 'not specified'}\n\n${formatHistoricalInsightsForAI(historicalInsights)}\n\nPlease provide specific, actionable suggestions for improving this goal based on SMART criteria and historical patterns.`

  return agent.prompt(refinementPrompt)
} 