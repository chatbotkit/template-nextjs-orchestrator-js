'use server'

import { getServerSession } from 'next-auth'

import authOptions from '@/lib/auth-options'

import { ChatBotKit } from '@chatbotkit/sdk'

const cbk = new ChatBotKit({
  secret: process.env.CHATBOTKIT_API_SECRET,
})

/**
 * Returns the authenticated session or throws.
 */
async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  return session
}

/**
 * Lists all agents (bots) for a given company (blueprint).
 *
 * @param {string} companyId - The blueprint ID
 */
export async function listAgents(companyId) {
  await requireSession()

  const { items } = await cbk.bot.list()

  // Filter bots that belong to this blueprint
  const agents = items.filter((bot) => bot.blueprintId === companyId)

  return agents.map(({ id, name, description, backstory, createdAt }) => ({
    id,
    name: name || 'Unnamed Agent',
    description: description || '',
    backstory: backstory || '',
    createdAt,
  }))
}

/**
 * Creates a new agent (bot) inside a company (blueprint).
 *
 * @param {{ companyId: string, name: string, description: string, backstory: string, model: string }} params
 */
export async function createAgent({
  companyId,
  name,
  description,
  backstory,
  model,
}) {
  await requireSession()

  const bot = await cbk.bot.create({
    blueprintId: companyId,
    name,
    description,
    backstory:
      backstory ||
      `You are ${name}, a helpful AI agent. You assist with business tasks and can read/write files, execute commands, and collaborate with other agents through a shared workspace.`,
    model: model || 'gpt-5.4-mini',
  })

  return {
    id: bot.id,
    name,
    description,
    backstory,
  }
}

/**
 * Fetches a single agent (bot) by ID.
 *
 * @param {string} agentId
 */
export async function fetchAgent(agentId) {
  await requireSession()

  const bot = await cbk.bot.fetch(agentId)

  return {
    id: bot.id,
    name: bot.name || 'Unnamed Agent',
    description: bot.description || '',
    backstory: bot.backstory || '',
    model: bot.model || '',
    blueprintId: bot.blueprintId,
    createdAt: bot.createdAt,
  }
}

/**
 * Updates an agent's name and/or backstory.
 *
 * @param {string} agentId
 * @param {{ name?: string, description?: string, backstory?: string, model?: string }} updates
 */
export async function updateAgent(
  agentId,
  { name, description, backstory, model }
) {
  await requireSession()

  await cbk.bot.update(agentId, {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(backstory !== undefined ? { backstory } : {}),
    ...(model !== undefined ? { model } : {}),
  })
}

/**
 * Deletes an agent (bot) by ID.
 *
 * @param {string} agentId
 */
export async function deleteAgent(agentId) {
  await requireSession()

  await cbk.bot.delete(agentId)
}
