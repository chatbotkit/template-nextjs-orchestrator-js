/**
 * Default list of models available when creating an agent.
 */
const DEFAULT_MODELS = [
  {
    label: 'GPT-5.4',
    value: 'gpt-5.4',
    description:
      "OpenAI's most capable model with advanced reasoning and instruction following.",
  },
  {
    label: 'GPT-5.4 Mini',
    value: 'gpt-5.4-mini',
    description: "OpenAI's fastest model, optimized for high-volume workloads.",
  },
  {
    label: 'Claude Sonnet 4.6',
    value: 'claude-4.6-sonnet',
    description:
      "Anthropic's balanced model combining speed with deep analytical capability.",
  },
]

/**
 * Returns the list of models available for agent creation.
 *
 * The list can be customised via the AGENT_MODELS environment variable as a
 * comma-separated list of entries. Each entry is either a plain model ID
 * (used as both label and value) or a "Label:modelId" pair:
 *
 *   AGENT_MODELS=GPT-5.4:gpt-5.4,GPT-5.4 Mini:gpt-5.4-mini
 *   AGENT_MODELS=gpt-5.4,gpt-5.4-mini
 *
 * When using the environment variable, descriptions are not shown.
 * This function is server-side only.
 *
 * @returns {{ label: string, value: string, description?: string }[]}
 */
export function getAgentModels() {
  const env = process.env.AGENT_MODELS

  if (!env?.trim()) {
    return DEFAULT_MODELS
  }

  return env
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colonIndex = entry.indexOf(':')

      if (colonIndex !== -1) {
        return {
          label: entry.slice(0, colonIndex).trim(),
          value: entry.slice(colonIndex + 1).trim(),
        }
      }

      return { label: entry, value: entry }
    })
}
