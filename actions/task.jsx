'use server'

import { getServerSession } from 'next-auth'

import authOptions from '@/lib/auth-options'

import { streamComplete } from '@chatbotkit/react/actions/complete'
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
 * Dispatches a one-off task to an agent. Uses the streaming complete API to
 * send the task description as a user message and stream the agent's response.
 *
 * @param {{ botId: string, task: string }} params
 */
export async function dispatchTask({ botId, task }) {
  await requireSession()

  return streamComplete({
    client: cbk.conversation,

    botId,

    messages: [{ type: 'user', text: task }],

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
  })
}
