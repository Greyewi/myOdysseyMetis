import type { AIConfig } from '../baseAgent'
import { createGoalEvaluationAgent } from '../evaluation/agent'

export async function validateGoalCompletion(validationData: any, customConfig?: AIConfig) {
  const agent = createGoalEvaluationAgent(customConfig)
  const validationPrompt = `Please analyze if this goal can be marked as complete based on the following data:

**Goal Information:**
- Title: ${validationData.goalTitle}
- Description: ${validationData.goalDescription}
- Category: ${validationData.goalCategory}
- Difficulty: ${validationData.difficulty}
- Status: ${validationData.status}
- Deadline: ${validationData.deadline.toISOString()}
- Current Date: ${validationData.currentDate.toISOString()}

**Task Completion Statistics:**
- Total Tasks: ${validationData.totalTasks}
- Completed Tasks: ${validationData.completedTasks}
- Completion Rate: ${validationData.completionRate.toFixed(1)}%

**AI Evaluation Data:**
- Has AI Evaluation: ${validationData.hasAIEvaluation}
- Achievability Score: ${validationData.achievabilityScore}/100
- AI Analysis Summary: ${validationData.aiAnalysisSummary || 'Not available'}

**User Context:**
- Weekly Time Commitment: ${validationData.weeklyTimeCommitment || 'Not specified'} hours
- Current Experience: ${validationData.currentExperience || 'Not specified'}
- Available Resources: ${validationData.availableResources || 'Not specified'}
- Starting Point: ${validationData.startingPoint || 'Not specified'}

Please respond with a JSON object: {"canMarkComplete": boolean, "reason": string, "confidence": "high|medium|low", "suggestions": string[]}`

  const response = await agent.prompt(validationPrompt)
  try {
    const parsed = JSON.parse(response)
    return {
      canMarkComplete: parsed.canMarkComplete || false,
      reason: parsed.reason || 'AI validation completed',
      confidence: parsed.confidence || 'medium',
      suggestions: parsed.suggestions || []
    }
  } catch {
    const canComplete = validationData.completionRate >= 70
    return {
      canMarkComplete: canComplete,
      reason: canComplete 
        ? `AI validation suggests goal can be completed based on ${validationData.completionRate.toFixed(1)}% task completion rate.`
        : `AI validation suggests goal should not be completed yet. Only ${validationData.completionRate.toFixed(1)}% of tasks are complete.`,
      confidence: 'medium',
      suggestions: canComplete ? [] : ['Complete more tasks before marking as finished', 'Review remaining tasks and their importance']
    }
  }
} 