import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import authOptions from '@/lib/auth-options'

import CompanySettingsPage from './company-settings-page'

export default async function Page({ params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const { companyId } = await params

  return <CompanySettingsPage companyId={companyId} />
}
