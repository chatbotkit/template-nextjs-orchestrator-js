'use client'

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { deleteCompany, fetchCompany, updateCompany } from '@/actions/company'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'

export default function CompanySettingsPage({ companyId }) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    fetchCompany(companyId)
      .then((company) => {
        setName(company.name)
        setDescription(company.description)
      })
      .catch((err) => console.error('Failed to load company:', err))
      .finally(() => setLoading(false))
  }, [companyId])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await updateCompany(companyId, { name, description })
      router.push('/agents')
    } catch (err) {
      console.error('Failed to update company:', err)
      setSaveError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [companyId, name, description, router])

  const handleDelete = useCallback(async () => {
    setDeleting(true)

    try {
      await deleteCompany(companyId)
      router.push('/agents')
    } catch (err) {
      console.error('Failed to delete company:', err)
      setDeleting(false)
    }
  }, [companyId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-base font-semibold">Company Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-10">
        {/* General settings */}
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold">General</h2>
            <p className="text-sm text-muted-foreground">
              Update the name and description for this company.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Name</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-desc">Description</Label>
              <Textarea
                id="company-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this company do?"
                rows={3}
              />
            </div>
          </div>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}

          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save changes
              </>
            )}
          </Button>
        </section>

        <Separator />

        {/* Danger zone */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-destructive">
              Danger zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Deleting a company is permanent and cannot be undone. All agents,
              tasks, and resources will be removed.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete company
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent and cannot be undone. All agents,
                  tasks, and resources associated with this company will be
                  deleted immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  )
}
