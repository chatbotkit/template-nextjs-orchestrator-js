import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'
import { getAgentModels } from '@/lib/models'

import AgentsPage from './agents-page'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const models = getAgentModels()

  return (
    <AgentsPage
      userName={session?.user?.name}
      userImage={session?.user?.image}
      models={models}
    />
  )
}
