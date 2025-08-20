import { Goal } from '@prisma/client'
import { historicalAnalysisService } from '../../services/historical-analysis.service'

export async function getGoalHistoricalInsights(goal: Goal): Promise<{ insights: any; recommendations: string[] } | null> {
  try {
    const insights = await historicalAnalysisService.analyzeHistoricalInsights(goal)
    const recommendations = await historicalAnalysisService.getPersonalizedRecommendations(goal)
    return { insights, recommendations }
  } catch (error) {
    console.error('Failed to get historical insights:', error)
    return null
  }
} 