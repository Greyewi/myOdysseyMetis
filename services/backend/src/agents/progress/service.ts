import { Goal } from '@prisma/client'
import type { AIConfig } from '../baseAgent'
import { createProgressAnalysisAgent } from '../progress/agent'
import { historicalAnalysisService } from '../../services/historical-analysis.service'

export async function analyzeGoalProgress(goal: Goal, tasks: any[], customConfig?: AIConfig): Promise<string> {
  const historicalInsights = await historicalAnalysisService.analyzeHistoricalInsights(goal)
  const agent = createProgressAnalysisAgent(customConfig)

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
  const pendingTasks = tasks.filter(t => t.status === 'PENDING')
  const activeTasks = tasks.filter(t => t.status === 'ACTIVE')

  const progressPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
  const goalAge = goal.createdAt ? Math.ceil((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
  const timeToDeadline = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const progressPrompt = `Please analyze the progress on this goal using both current status and historical benchmarks:

**Goal Information:**
- Title: ${goal.title}
- Category: ${(goal as any).category}
- Deadline: ${goal.deadline.toISOString()}
- Days since creation: ${goalAge}
- Days until deadline: ${timeToDeadline}
- Achievability Score: ${(goal as any).achievabilityScore || 'not evaluated'}

**Current Progress:**
- Progress: ${progressPercentage.toFixed(1)}% (${completedTasks.length}/${tasks.length} tasks completed)
- Active: ${activeTasks.length}
- Pending: ${pendingTasks.length}

${(function formatInsights(i:any){ return `Historical avg completion time: ${i.averageCompletionTime || 'N/A'} days`})(historicalInsights)}

Please provide:
1. Progress assessment compared to historical benchmarks
2. Identification of concerning patterns vs similar goals
3. Data-driven recommendations
4. Timeline adjustments
5. Motivational insights using historical success stories`

  return agent.prompt(progressPrompt)
} 