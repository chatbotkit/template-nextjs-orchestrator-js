import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'

import TasksPage from './tasks-page'

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <TasksPage
      userName={session?.user?.name}
      userImage={session?.user?.image}
    />
  )
}
