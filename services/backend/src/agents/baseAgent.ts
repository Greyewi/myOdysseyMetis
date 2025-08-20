export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'custom'
  model: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
}

export const defaultAIConfigs: Record<string, AIConfig> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.6,
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.6,
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com',
    temperature: 0.6,
  },
  deepseekReasoner: {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com',
    temperature: 0.6,
  },
}

export function getAIConfig(configName?: string): AIConfig {
  const selectedConfig = configName || process.env.AI_PROVIDER || 'openai'
  const config = defaultAIConfigs[selectedConfig]
  if (!config) throw new Error(`Unknown AI configuration: ${selectedConfig}`)
  if (!config.apiKey) throw new Error(`API key not found for provider: ${config.provider}`)
  return config
}

// Safe loader for alith Agent to avoid native binary issues in some environments
let AgentCtor: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AgentCtor = require('alith').Agent
} catch {
  AgentCtor = class {
    constructor(_: any) {}
    async prompt() { throw new Error('AI disabled: alith not available') }
  }
}

export const aiEnabled = Boolean(
  process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY
)

export function createAgent(preamble: string, config?: AIConfig): any {
  const aiConfig = config || getAIConfig()

  const agentConfig: any = {
    model: aiConfig.model,
    preamble,
  }

  if (aiConfig.apiKey) agentConfig.apiKey = aiConfig.apiKey
  if (aiConfig.baseUrl) agentConfig.baseUrl = aiConfig.baseUrl

  return new AgentCtor(agentConfig)
} 