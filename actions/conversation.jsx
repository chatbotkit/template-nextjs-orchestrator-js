'use server'

import { getServerSession } from 'next-auth'

import authOptions from '@/lib/auth-options'

import { streamComplete } from '@chatbotkit/react/actions/complete'
import { ChatBotKit } from '@chatbotkit/sdk'

import crypto from 'node:crypto'

const cbk = new ChatBotKit({
  secret: process.env.CHATBOTKIT_API_SECRET,
})

/**
 * @note Namespace for generating deterministic UUID v5 fingerprints from user
 * emails. This ensures the same email always produces the same fingerprint
 * without leaking PII.
 */
const CONTACT_NAMESPACE = 'a8b3c4d5-e6f7-4890-abcd-ef1234567890'

/**
 * Generates a deterministic UUID v5 from an email address and namespace.
 *
 * @param {string} email - The email to derive a fingerprint from
 * @returns {string} A deterministic UUID v5 string
 */
function generateFingerprint(email) {
  const namespaceBytes = Buffer.from(CONTACT_NAMESPACE.replace(/-/g, ''), 'hex')

  const hash = crypto
    .createHash('sha1')
    .update(namespaceBytes)
    .update(email.toLowerCase())
    .digest()

  // Set version to 5 (SHA-1 based)
  hash[6] = (hash[6] & 0x0f) | 0x50

  // Set variant to RFC 4122
  hash[8] = (hash[8] & 0x3f) | 0x80

  const hex = hash.toString('hex').slice(0, 32)

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

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
 * Ensures a ChatBotKit contact exists for the authenticated user.
 *
 * @returns {Promise<string>} The contact ID
 */
export async function ensureContact() {
  const session = await requireSession()

  const { id } = await cbk.contact.ensure({
    fingerprint: generateFingerprint(session.user.email),
    email: session.user.email,
    name: session.user.name || '',
  })

  return id
}

/**
 * Lists conversations for a contact, ordered by most recent first.
 *
 * @param {string} contactId - The contact ID to list conversations for
 */
export async function listConversations(contactId) {
  await requireSession()

  const { items } = await cbk.contact.conversation.list(contactId, {
    order: 'desc',
    take: 50,
  })

  return items.map(({ id, name, description, createdAt }) => ({
    id,
    name: name || '',
    description: description || '',
    createdAt,
  }))
}

/**
 * Deletes a conversation from the platform.
 *
 * @param {string} conversationId - The conversation ID to delete
 */
export async function deleteConversation(conversationId) {
  await requireSession()

  await cbk.conversation.delete(conversationId)
}

/**
 * Fetches the messages of an existing conversation.
 *
 * @param {string} conversationId - The conversation ID
 */
export async function fetchConversationMessages(conversationId) {
  await requireSession()

  const { items } = await cbk.conversation.message.list(conversationId)

  return items
    .filter(({ type }) => type === 'user' || type === 'bot')
    .map(({ id, type, text, createdAt }) => ({
      id,
      type,
      text,
      createdAt: new Date(createdAt).toISOString(),
    }))
}

/**
 * Generates a short name and description for a conversation based on its
 * messages.
 *
 * @param {Array<{ type: string, text: string }>} messages
 */
async function generateConversationLabel(messages) {
  const userMessages = messages
    .filter((m) => m.type === 'user')
    .map((m) => m.text)
    .slice(0, 3)
    .join(' ')

  const name = userMessages.slice(0, 80) || 'New conversation'
  const description = userMessages.slice(0, 200) || ''

  return { name, description }
}

/**
 * Completes a conversation turn using ChatBotKit streaming.
 *
 * @param {object} params
 * @param {string} params.botId - The agent (bot) ID to chat with
 * @param {string} [params.contactId] - The contact ID
 * @param {string} [params.conversationId] - Resume an existing conversation
 * @param {Array} params.messages - The conversation messages
 */
export async function complete({ botId, contactId, conversationId, messages }) {
  await requireSession()

  return streamComplete({
    client: cbk.conversation,

    ...(botId
      ? { botId }
      : {
          backstory:
            'You are a helpful business assistant. You help users manage their tasks and operations.',
          model: 'gpt-5.4-mini',
        }),

    ...(contactId ? { contactId } : {}),

    messages,

    functions: [
      {
        name: 'getCurrentTime',
        description: 'Gets the current date and time',
        parameters: {},
        handler: async () => {
          return {
            result: {
              time: new Date().toISOString(),
            },
          }
        },
      },
    ],

    async onStart() {
      if (!contactId) {
        return
      }

      if (!conversationId) {
        const conversation = await cbk.conversation.create({
          contactId,
          botId,
        })

        conversationId = conversation.id
      }

      return {
        type: 'conversation',
        data: { id: conversationId },
      }
    },

    async onFinish({ messages: allMessages }) {
      if (!conversationId) {
        return
      }

      const newMessages = allMessages.slice(messages.length - 1)

      if (newMessages.length === 0) {
        return
      }

      for (const msg of newMessages) {
        await cbk.conversation.message.create(conversationId, {
          type: msg.type,
          text: msg.text,
        })
      }

      const { name, description } = await generateConversationLabel(allMessages)

      await cbk.conversation.update(conversationId, { name, description })

      return {
        type: 'conversation',
        data: { id: conversationId, name, description },
      }
    },
  })
}
