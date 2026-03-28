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
 * Lists all companies (blueprints) for the authenticated user.
 */
export async function listCompanies() {
  await requireSession()

  const { items } = await cbk.blueprint.list()

  return items.map(({ id, name, description, createdAt }) => ({
    id,
    name: name || 'Unnamed Company',
    description: description || '',
    createdAt,
  }))
}

/**
 * Creates a new company (blueprint).
 *
 * @param {{ name: string, description: string }} params
 */
export async function createCompany({ name, description }) {
  await requireSession()

  const blueprint = await cbk.blueprint.create({
    name,
    description,
  })

  return {
    id: blueprint.id,
    name,
    description,
  }
}

/**
 * Fetches a single company (blueprint) by ID.
 *
 * @param {string} companyId
 */
export async function fetchCompany(companyId) {
  await requireSession()

  const blueprint = await cbk.blueprint.fetch(companyId)

  return {
    id: blueprint.id,
    name: blueprint.name || 'Unnamed Company',
    description: blueprint.description || '',
    createdAt: blueprint.createdAt,
  }
}

/**
 * Updates a company (blueprint) by ID.
 *
 * @param {string} companyId
 * @param {{ name?: string, description?: string }} params
 */
export async function updateCompany(companyId, { name, description }) {
  await requireSession()

  await cbk.blueprint.update(companyId, { name, description })

  return { id: companyId, name, description }
}

/**
 * Deletes a company (blueprint) by ID.
 *
 * @param {string} companyId
 */
export async function deleteCompany(companyId) {
  await requireSession()

  await cbk.blueprint.delete(companyId)
}
