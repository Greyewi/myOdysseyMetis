import { Goal } from '@prisma/client'
import { prisma } from '../../prisma'
import { createGoalEvaluationAgent } from '../evaluation/agent'
import type { AIConfig } from '../baseAgent'
import { historicalAnalysisService } from '../../services/historical-analysis.service'

export interface GoalEvaluationResult {
  achievabilityScore: number
  summary: string
  analysisDetails: any
  historicalInsights?: any
  recommendations?: string[]
}

function formatHistoricalInsightsForAI(insights: any): string {
  if (!insights || insights.totalSimilarGoals === 0) {
    return 'No historical data available for similar goals.'
  }
  return `
**Historical Analysis of Similar Goals:**
- Similar goals analyzed: ${insights.totalSimilarGoals}
- Historical success rate: ${Math.round(insights.successRate * 100)}%
- Category success rate: ${Math.round(insights.categorySuccessRate * 100)}%
- Average completion time: ${insights.averageCompletionTime ? `${Math.round(insights.averageCompletionTime)} days` : 'N/A'}
- Average weekly commitment for successful goals: ${Math.round(insights.timeCommitmentAnalysis.averageCommitment)} hours

**Success Factors from Historical Data:**
${insights.successFactors.map((factor: string) => `- ${factor}`).join('\n')}

**Common Failure Reasons:**
${insights.commonFailureReasons.map((reason: string) => `- ${reason}`).join('\n')}

**Time Commitment Analysis:**
${insights.timeCommitmentAnalysis.successRateByCommitment.map((range: any) => `- ${range.range}: ${Math.round(range.successRate * 100)}% success rate`).join('\n')}

**Deadline Analysis:**
${insights.deadlineAnalysis.successRateByDuration.map((range: any) => `- ${range.range}: ${Math.round(range.successRate * 100)}% success rate`).join('\n')}
`
}

function anonymizeGoalData(goal: Goal): any {
  return {
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    weeklyTimeCommitment: (goal as any).weeklyTimeCommitment,
    currentExperience: (goal as any).currentExperience,
    availableResources: (goal as any).availableResources,
    startingPoint: (goal as any).startingPoint,
    category: (goal as any).category,
  }
}

function validateGoalForAI(goal: Goal): { isValid: boolean; missingFields: string[] } {
  const required = ['title','description','deadline','weeklyTimeCommitment','currentExperience','availableResources','startingPoint']
  const missing = required.filter(f => !((goal as any)[f]) || (typeof (goal as any)[f] === 'string' && (goal as any)[f].trim().length === 0))
  return { isValid: missing.length === 0, missingFields: missing }
}

const aiCallLimits = new Map<number, { count: number; resetTime: number }>()
function checkRateLimit(userId: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const userLimit = aiCallLimits.get(userId)
  if (!userLimit || now > userLimit.resetTime) {
    aiCallLimits.set(userId, { count: 1, resetTime: now + 3600000 })
    return { allowed: true }
  }
  if (userLimit.count >= 10) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) }
  }
  userLimit.count++
  return { allowed: true }
}

export async function evaluateGoalRealism(goal: Goal, customConfig?: AIConfig): Promise<GoalEvaluationResult> {
  const validation = validateGoalForAI(goal)
  if (!validation.isValid) {
    throw new Error(`Missing required fields for AI evaluation: ${validation.missingFields.join(', ')}`)
  }
  const rateLimitCheck = checkRateLimit(goal.userId)
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds.`)
  }
  const historicalInsights = await historicalAnalysisService.analyzeHistoricalInsights(goal)
  const recommendations = await historicalAnalysisService.getPersonalizedRecommendations(goal)
  const anonymizedGoal = anonymizeGoalData(goal)
  const agent = createGoalEvaluationAgent(customConfig)

  const evaluationPrompt = `Please evaluate the following goal using both the goal details and historical data from similar goals:

**Goal Details (anonymized for privacy):**
- Title: ${anonymizedGoal.title}
- Description: ${anonymizedGoal.description}
- Category: ${anonymizedGoal.category}
- Deadline: ${anonymizedGoal.deadline?.toISOString()}
- Weekly Time Commitment: ${anonymizedGoal.weeklyTimeCommitment || 'not specified'}
- Current Experience: ${anonymizedGoal.currentExperience || 'not specified'}
- Available Resources: ${anonymizedGoal.availableResources || 'not specified'}
- Starting Point: ${anonymizedGoal.startingPoint || 'not specified'}

${formatHistoricalInsightsForAI(historicalInsights)}

**Instructions:**
Consider both the goal-specific factors AND the historical performance of similar goals when evaluating. 
The historical success rate of ${Math.round(historicalInsights.successRate * 100)}% should significantly influence your assessment.

If the historical success rate is:
- Below 30%: Be more conservative in your evaluation (typically 0.2-0.5 range)
- 30-70%: Use moderate evaluation (typically 0.4-0.7 range) 
- Above 70%: Can be more optimistic (typically 0.6-0.9 range)

**Privacy Notice**: This data has been anonymized and contains no personal identifiers.

**Required Output Format:**
Please respond with exactly 3 lines:
Line 1: achievabilityScore (number between 0.0 and 1.0)
Line 2: summary (1-2 sentences referencing historical data)
Line 3: structured analysis (JSON with time, experience, resourceGaps, historicalContext)
`

  const response = await agent.prompt(evaluationPrompt)
  const lines = response.trim().split('\n')
  if (lines.length < 3) throw new Error('Unexpected response format from AI agent')

  const achievabilityScore = parseFloat(lines[0].trim())
  const summary = lines[1].trim()
  let analysisDetails
  try {
    analysisDetails = JSON.parse(lines[2].trim())
  } catch {
    analysisDetails = { 
      error: 'Analysis details parsing failed',
      rawResponse: lines[2].trim(),
      historicalContext: { score: historicalInsights.successRate }
    }
  }

  if (isNaN(achievabilityScore) || achievabilityScore < 0 || achievabilityScore > 1) {
    throw new Error('Invalid achievability score from AI agent')
  }
  if (summary.length > 500) {
    throw new Error('AI summary too long, potential data leakage concern')
  }

  await prisma.goal.update({
    where: { id: goal.id },
    data: {
      achievabilityScore,
      aiAnalysisSummary: summary,
      aiReviewedAt: new Date(),
      evaluation: {
        upsert: {
          create: {
            realismScore: Math.round(achievabilityScore * 100),
            summary,
            analysisDetails,
          },
          update: {
            realismScore: Math.round(achievabilityScore * 100),
            summary,
            analysisDetails,
          }
        }
      }
    }
  })

  return { achievabilityScore, summary, analysisDetails, historicalInsights, recommendations }
} 