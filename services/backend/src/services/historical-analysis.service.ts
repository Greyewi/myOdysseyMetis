import { Goal, GoalStatus, GoalCategory, TaskStatus } from '@prisma/client'
import { prisma } from '../prisma'

interface HistoricalGoal extends Goal {
  tasks?: Array<{ status: TaskStatus; deadline: Date; createdAt: Date; updatedAt: Date }>
  wallets?: Array<{ lastBalance: string | null; network: string }>
}

interface SimilarityScore {
  goalId: number
  similarityScore: number
  goal: HistoricalGoal
}

export interface HistoricalInsights {
  totalSimilarGoals: number
  successRate: number
  averageCompletionTime: number | null
  commonFailureReasons: string[]
  successFactors: string[]
  averageAchievabilityScore: number | null
  categorySuccessRate: number
  timeCommitmentAnalysis: {
    averageCommitment: number
    successRateByCommitment: { range: string; successRate: number }[]
  }
  deadlineAnalysis: {
    averageDurationDays: number
    successRateByDuration: { range: string; successRate: number }[]
  }
}

interface GoalSimilarityFactors {
  category: number
  timeCommitment: number
  experienceLevel: number
  deadline: number
  resourceAvailability: number
}

export class HistoricalAnalysisService {
  
  // Calculate similarity score between two goals
  private calculateSimilarityScore(currentGoal: Goal, historicalGoal: HistoricalGoal): number {
    const factors: GoalSimilarityFactors = {
      category: 0,
      timeCommitment: 0,
      experienceLevel: 0,
      deadline: 0,
      resourceAvailability: 0
    }

    // Category similarity (high weight)
    if (currentGoal.category === historicalGoal.category) {
      factors.category = 0.3
    }

    // Time commitment similarity
    if (currentGoal.weeklyTimeCommitment && historicalGoal.weeklyTimeCommitment) {
      const timeDiff = Math.abs(currentGoal.weeklyTimeCommitment - historicalGoal.weeklyTimeCommitment)
      factors.timeCommitment = Math.max(0, 0.2 - (timeDiff / 50) * 0.2) // Max 50 hours difference
    }

    // Experience level similarity (basic text matching)
    if (currentGoal.currentExperience && historicalGoal.currentExperience) {
      const experienceKeywords = ['beginner', 'intermediate', 'advanced', 'expert', 'novice']
      const currentExp = currentGoal.currentExperience.toLowerCase()
      const historicalExp = historicalGoal.currentExperience.toLowerCase()
      
      const currentLevel = this.extractExperienceLevel(currentExp, experienceKeywords)
      const historicalLevel = this.extractExperienceLevel(historicalExp, experienceKeywords)
      
      if (currentLevel === historicalLevel) {
        factors.experienceLevel = 0.2
      } else if (Math.abs(currentLevel - historicalLevel) === 1) {
        factors.experienceLevel = 0.1
      }
    }

    // Deadline similarity (goal duration)
    const currentDuration = this.calculateGoalDuration(currentGoal)
    const historicalDuration = this.calculateGoalDuration(historicalGoal)
    
    if (currentDuration && historicalDuration) {
      const durationDiff = Math.abs(currentDuration - historicalDuration)
      factors.deadline = Math.max(0, 0.15 - (durationDiff / 365) * 0.15) // Max 1 year difference
    }

    // Resource availability similarity (basic keyword matching)
    if (currentGoal.availableResources && historicalGoal.availableResources) {
      const resourceSimilarity = this.calculateResourceSimilarity(
        currentGoal.availableResources,
        historicalGoal.availableResources
      )
      factors.resourceAvailability = resourceSimilarity * 0.15
    }

    return Object.values(factors).reduce((sum, factor) => sum + factor, 0)
  }

  private extractExperienceLevel(experience: string, keywords: string[]): number {
    const experienceLevels = {
      'beginner': 1,
      'novice': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    }

    for (const [level, value] of Object.entries(experienceLevels)) {
      if (experience.includes(level)) {
        return value
      }
    }
    return 2 // Default to intermediate
  }

  private calculateGoalDuration(goal: Goal): number | null {
    if (!goal.createdAt || !goal.deadline) return null
    
    const start = new Date(goal.createdAt)
    const end = new Date(goal.deadline)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateResourceSimilarity(resources1: string, resources2: string): number {
    const keywords1 = this.extractResourceKeywords(resources1)
    const keywords2 = this.extractResourceKeywords(resources2)
    
    const intersection = keywords1.filter(keyword => keywords2.includes(keyword))
    const union = [...new Set([...keywords1, ...keywords2])]
    
    return union.length > 0 ? intersection.length / union.length : 0
  }

  private extractResourceKeywords(resources: string): string[] {
    const resourceKeywords = [
      'budget', 'money', 'mentor', 'coach', 'course', 'book', 'time', 
      'equipment', 'software', 'support', 'team', 'family', 'friends',
      'internet', 'computer', 'workspace', 'gym', 'library', 'certification'
    ]
    
    const text = resources.toLowerCase()
    return resourceKeywords.filter(keyword => text.includes(keyword))
  }

  // Find similar historical goals
  async findSimilarGoals(currentGoal: Goal, limit: number = 50): Promise<SimilarityScore[]> {
    // Get historical goals (completed or failed) that have enough data
    const historicalGoals = await prisma.goal.findMany({
      where: {
        status: { in: [GoalStatus.COMPLETED, GoalStatus.FAILED] },
        weeklyTimeCommitment: { not: null },
        currentExperience: { not: null },
        availableResources: { not: null },
        id: { not: currentGoal.id } // Exclude current goal
      },
      include: {
        tasks: {
          select: {
            status: true,
            deadline: true,
            createdAt: true,
            updatedAt: true
          }
        },
        wallets: {
          select: {
            lastBalance: true,
            network: true
          }
        }
      },
      take: 200 // Limit initial dataset for performance
    })

    // Calculate similarity scores
    const similarityScores: SimilarityScore[] = historicalGoals
      .map(historicalGoal => ({
        goalId: historicalGoal.id,
        similarityScore: this.calculateSimilarityScore(currentGoal, historicalGoal),
        goal: historicalGoal
      }))
      .filter(score => score.similarityScore > 0.1) // Only include reasonably similar goals
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)

    return similarityScores
  }

  // Analyze historical insights from similar goals
  async analyzeHistoricalInsights(currentGoal: Goal): Promise<HistoricalInsights> {
    const similarGoals = await this.findSimilarGoals(currentGoal, 30)
    
    if (similarGoals.length === 0) {
      return this.getDefaultInsights(currentGoal)
    }

    const totalSimilarGoals = similarGoals.length
    const successfulGoals = similarGoals.filter(sg => sg.goal.status === GoalStatus.COMPLETED)
    const successRate = successfulGoals.length / totalSimilarGoals

    // Calculate average completion time for successful goals
    const completionTimes = successfulGoals
      .map(sg => this.calculateActualCompletionTime(sg.goal))
      .filter(time => time !== null) as number[]
    
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : null

    // Analyze achievability scores
    const achievabilityScores = similarGoals
      .map(sg => sg.goal.achievabilityScore)
      .filter(score => score !== null) as number[]
    
    const averageAchievabilityScore = achievabilityScores.length > 0
      ? achievabilityScores.reduce((sum, score) => sum + score, 0) / achievabilityScores.length
      : null

    // Category-specific success rate
    const categoryGoals = await this.getCategorySuccessRate(currentGoal.category)

    // Time commitment analysis
    const timeCommitmentAnalysis = this.analyzeTimeCommitment(similarGoals)

    // Deadline analysis
    const deadlineAnalysis = this.analyzeDeadlines(similarGoals)

    // Identify success factors and failure reasons
    const successFactors = this.identifySuccessFactors(successfulGoals)
    const failedGoals = similarGoals.filter(sg => sg.goal.status === GoalStatus.FAILED)
    const commonFailureReasons = this.identifyFailureReasons(failedGoals)

    return {
      totalSimilarGoals,
      successRate,
      averageCompletionTime,
      commonFailureReasons,
      successFactors,
      averageAchievabilityScore,
      categorySuccessRate: categoryGoals.successRate,
      timeCommitmentAnalysis,
      deadlineAnalysis
    }
  }

  private calculateActualCompletionTime(goal: HistoricalGoal): number | null {
    if (!goal.createdAt || !goal.updatedAt || goal.status !== GoalStatus.COMPLETED) {
      return null
    }
    
    const start = new Date(goal.createdAt)
    const end = new Date(goal.updatedAt)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  private async getCategorySuccessRate(category: GoalCategory): Promise<{ successRate: number; total: number }> {
    const categoryGoals = await prisma.goal.findMany({
      where: {
        category,
        status: { in: [GoalStatus.COMPLETED, GoalStatus.FAILED] }
      },
      select: {
        status: true
      }
    })

    const total = categoryGoals.length
    const successful = categoryGoals.filter(g => g.status === GoalStatus.COMPLETED).length
    
    return {
      successRate: total > 0 ? successful / total : 0,
      total
    }
  }

  private analyzeTimeCommitment(similarGoals: SimilarityScore[]) {
    const commitments = similarGoals
      .map(sg => ({ 
        commitment: sg.goal.weeklyTimeCommitment || 0, 
        success: sg.goal.status === GoalStatus.COMPLETED 
      }))
      .filter(item => item.commitment > 0)

    const averageCommitment = commitments.length > 0 
      ? commitments.reduce((sum, item) => sum + item.commitment, 0) / commitments.length 
      : 0

    // Group by commitment ranges
    const ranges = [
      { range: '1-5 hours', min: 1, max: 5 },
      { range: '6-15 hours', min: 6, max: 15 },
      { range: '16-30 hours', min: 16, max: 30 },
      { range: '31+ hours', min: 31, max: 999 }
    ]

    const successRateByCommitment = ranges.map(range => {
      const rangeGoals = commitments.filter(
        item => item.commitment >= range.min && item.commitment <= range.max
      )
      
      return {
        range: range.range,
        successRate: rangeGoals.length > 0 
          ? rangeGoals.filter(item => item.success).length / rangeGoals.length 
          : 0
      }
    })

    return {
      averageCommitment,
      successRateByCommitment
    }
  }

  private analyzeDeadlines(similarGoals: SimilarityScore[]) {
    const durations = similarGoals
      .map(sg => ({ 
        duration: this.calculateGoalDuration(sg.goal) || 0, 
        success: sg.goal.status === GoalStatus.COMPLETED 
      }))
      .filter(item => item.duration > 0)

    const averageDurationDays = durations.length > 0 
      ? durations.reduce((sum, item) => sum + item.duration, 0) / durations.length 
      : 0

    // Group by duration ranges
    const ranges = [
      { range: '1-30 days', min: 1, max: 30 },
      { range: '31-90 days', min: 31, max: 90 },
      { range: '91-180 days', min: 91, max: 180 },
      { range: '181+ days', min: 181, max: 999 }
    ]

    const successRateByDuration = ranges.map(range => {
      const rangeGoals = durations.filter(
        item => item.duration >= range.min && item.duration <= range.max
      )
      
      return {
        range: range.range,
        successRate: rangeGoals.length > 0 
          ? rangeGoals.filter(item => item.success).length / rangeGoals.length 
          : 0
      }
    })

    return {
      averageDurationDays,
      successRateByDuration
    }
  }

  private identifySuccessFactors(successfulGoals: SimilarityScore[]): string[] {
    const factors: string[] = []

    // Analyze common patterns in successful goals
    const resources = successfulGoals.map(sg => sg.goal.availableResources || '').join(' ').toLowerCase()
    const experiences = successfulGoals.map(sg => sg.goal.currentExperience || '').join(' ').toLowerCase()

    // Check for common success indicators
    if (resources.includes('mentor') || resources.includes('coach')) {
      factors.push('Having a mentor or coach significantly increases success rate')
    }
    
    if (resources.includes('budget') || resources.includes('money')) {
      factors.push('Adequate financial resources improve chances of success')
    }

    if (experiences.includes('previous') || experiences.includes('experience')) {
      factors.push('Prior experience in the goal area increases likelihood of success')
    }

    // Analyze time commitment patterns
    const avgCommitment = successfulGoals.reduce((sum, sg) => 
      sum + (sg.goal.weeklyTimeCommitment || 0), 0) / successfulGoals.length

    if (avgCommitment > 10) {
      factors.push('Higher weekly time commitment (10+ hours) correlates with success')
    }

    return factors.length > 0 ? factors : ['Consistent effort and realistic expectations are key to success']
  }

  private identifyFailureReasons(failedGoals: SimilarityScore[]): string[] {
    const reasons: string[] = []

    if (failedGoals.length === 0) {
      return ['Insufficient historical data for failure analysis']
    }

    // Analyze common patterns in failed goals
    const resources = failedGoals.map(sg => sg.goal.availableResources || '').join(' ').toLowerCase()
    const timeCommitments = failedGoals.map(sg => sg.goal.weeklyTimeCommitment || 0)

    // Check for common failure indicators
    if (resources.includes('limited') || resources.includes('no budget')) {
      reasons.push('Insufficient resources or budget constraints')
    }

    const avgFailedCommitment = timeCommitments.reduce((sum, tc) => sum + tc, 0) / timeCommitments.length
    if (avgFailedCommitment < 5) {
      reasons.push('Insufficient time commitment (less than 5 hours per week)')
    }

    // Check for overly ambitious deadlines
    const durations = failedGoals.map(sg => this.calculateGoalDuration(sg.goal)).filter(d => d !== null) as number[]
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    
    if (avgDuration < 30) {
      reasons.push('Overly aggressive deadlines (less than 30 days)')
    }

    return reasons.length > 0 ? reasons : ['Common causes include unrealistic timelines and insufficient planning']
  }

  private getDefaultInsights(currentGoal: Goal): HistoricalInsights {
    return {
      totalSimilarGoals: 0,
      successRate: 0.5, // Default 50% success rate
      averageCompletionTime: null,
      commonFailureReasons: ['Insufficient historical data for this goal type'],
      successFactors: ['Be realistic with timeline and commit adequate time weekly'],
      averageAchievabilityScore: null,
      categorySuccessRate: 0.5,
      timeCommitmentAnalysis: {
        averageCommitment: 0,
        successRateByCommitment: []
      },
      deadlineAnalysis: {
        averageDurationDays: 0,
        successRateByDuration: []
      }
    }
  }

  // Get personalized recommendations based on historical data
  async getPersonalizedRecommendations(currentGoal: Goal): Promise<string[]> {
    const insights = await this.analyzeHistoricalInsights(currentGoal)
    const recommendations: string[] = []

    // Success rate recommendations
    if (insights.successRate < 0.3) {
      recommendations.push(`⚠️ Similar goals have a low success rate (${Math.round(insights.successRate * 100)}%). Consider extending your deadline or reducing scope.`)
    } else if (insights.successRate > 0.8) {
      recommendations.push(`✅ Similar goals have a high success rate (${Math.round(insights.successRate * 100)}%). You're on a good track!`)
    }

    // Time commitment recommendations
    if (currentGoal.weeklyTimeCommitment) {
      const optimalRange = insights.timeCommitmentAnalysis.successRateByCommitment
        .sort((a, b) => b.successRate - a.successRate)[0]
      
      if (optimalRange && optimalRange.successRate > insights.successRate + 0.2) {
        recommendations.push(`💡 Goals with ${optimalRange.range} weekly commitment have higher success rates. Consider adjusting your time allocation.`)
      }
    }

    // Category-specific recommendations
    if (insights.categorySuccessRate < 0.4) {
      recommendations.push(`📊 ${currentGoal.category} goals tend to be challenging. Extra planning and realistic expectations are crucial.`)
    }

    // Historical success factors
    insights.successFactors.slice(0, 2).forEach(factor => {
      recommendations.push(`🎯 ${factor}`)
    })

    return recommendations.length > 0 ? recommendations : ['Based on your goal details, maintain consistent effort and track progress regularly.']
  }
}

export const historicalAnalysisService = new HistoricalAnalysisService() 