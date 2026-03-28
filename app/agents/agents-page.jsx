'use client'

import { useCallback, useEffect, useState } from 'react'

import { signOut } from 'next-auth/react'
import Link from 'next/link'

import { createAgent, deleteAgent, listAgents } from '@/actions/agent'
import { createCompany, listCompanies } from '@/actions/company'
import { AgentForm } from '@/components/agents/agent-form'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import {
  Bot,
  Building2,
  ChevronDown,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'

export default function AgentsPage({ userName, userImage, models = [] }) {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentsLoading, setAgentsLoading] = useState(false)

  // Company creation dialog state
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyDescription, setNewCompanyDescription] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)

  // Agent creation dialog state
  const [agentDialogOpen, setAgentDialogOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [newAgentBackstory, setNewAgentBackstory] = useState('')
  const [newAgentModel, setNewAgentModel] = useState(
    models[0]?.value || 'gpt-4o'
  )
  const [creatingAgent, setCreatingAgent] = useState(false)

  // Load companies on mount
  useEffect(() => {
    listCompanies()
      .then((items) => {
        setCompanies(items)

        if (items.length > 0) {
          setSelectedCompanyId(items[0].id)
        }
      })
      .catch((err) => console.error('Failed to load companies:', err))
      .finally(() => setLoading(false))
  }, [])

  // Load agents when company changes
  useEffect(() => {
    if (!selectedCompanyId) {
      setAgents([])

      return
    }

    setAgentsLoading(true)
    listAgents(selectedCompanyId)
      .then(setAgents)
      .catch((err) => console.error('Failed to load agents:', err))
      .finally(() => setAgentsLoading(false))
  }, [selectedCompanyId])

  const handleCreateCompany = useCallback(async () => {
    if (!newCompanyName.trim()) {
      return
    }

    setCreatingCompany(true)

    try {
      const company = await createCompany({
        name: newCompanyName,
        description: newCompanyDescription,
      })

      setCompanies((prev) => [company, ...prev])
      setSelectedCompanyId(company.id)
      setCompanyDialogOpen(false)
      setNewCompanyName('')
      setNewCompanyDescription('')
    } catch (err) {
      console.error('Failed to create company:', err)
    } finally {
      setCreatingCompany(false)
    }
  }, [newCompanyName, newCompanyDescription])

  const handleCreateAgent = useCallback(async () => {
    if (!newAgentName.trim() || !selectedCompanyId) {
      return
    }

    setCreatingAgent(true)

    try {
      const agent = await createAgent({
        companyId: selectedCompanyId,
        name: newAgentName,
        description: newAgentDescription,
        backstory: newAgentBackstory,
        model: newAgentModel,
      })

      setAgents((prev) => [agent, ...prev])
      setAgentDialogOpen(false)
      setNewAgentName('')
      setNewAgentDescription('')
      setNewAgentBackstory('')
      setNewAgentModel(models[0]?.value || 'gpt-4o')
    } catch (err) {
      console.error('Failed to create agent:', err)
    } finally {
      setCreatingAgent(false)
    }
  }, [
    newAgentName,
    newAgentDescription,
    newAgentBackstory,
    newAgentModel,
    selectedCompanyId,
  ])

  const handleDeleteAgent = useCallback(async (agentId) => {
    try {
      await deleteAgent(agentId)
      setAgents((prev) => prev.filter((a) => a.id !== agentId))
    } catch (err) {
      console.error('Failed to delete agent:', err)
    }
  }, [])

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  // Company creation dialog (shared, can be opened from header dropdown)
  const companyDialog = (
    <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Company</DialogTitle>
          <DialogDescription>
            A company is a workspace for your agents, tools, and shared
            resources.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Name</Label>
            <Input
              id="company-name"
              placeholder="e.g. Acme Corp"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-desc">Description</Label>
            <Textarea
              id="company-desc"
              placeholder="What does this company do?"
              value={newCompanyDescription}
              onChange={(e) => setNewCompanyDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateCompany} disabled={creatingCompany}>
            {creatingCompany ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Company'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {companyDialog}

      {/* Header */}
      <header className="border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Company dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 font-semibold text-base px-2 max-w-xs"
              >
                <Building2 className="h-5 w-5 shrink-0" />
                <span className="truncate">
                  {selectedCompany
                    ? selectedCompany.name
                    : 'Business Orchestrator'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {companies.length > 0 && (
                <>
                  {companies.map((company) => (
                    <DropdownMenuItem
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{company.name}</span>
                      </span>
                      {selectedCompanyId === company.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setCompanyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-3">
            {selectedCompany && (
              <>
                <Link href="/tasks">
                  <Button variant="outline" size="sm">
                    Tasks
                  </Button>
                </Link>
                <Separator orientation="vertical" className="h-5" />
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userImage} />
                    <AvatarFallback>
                      {userName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:inline">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {selectedCompany ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedCompany.name}
                </h2>
                {selectedCompany.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCompany.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/companies/${selectedCompany.id}/settings`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>

                <Dialog
                  open={agentDialogOpen}
                  onOpenChange={setAgentDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create an Agent</DialogTitle>
                      <DialogDescription>
                        Agents can read/write files, execute commands, and
                        collaborate through a shared workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <AgentForm
                      name={newAgentName}
                      onNameChange={setNewAgentName}
                      description={newAgentDescription}
                      onDescriptionChange={setNewAgentDescription}
                      backstory={newAgentBackstory}
                      onBackstoryChange={setNewAgentBackstory}
                      model={newAgentModel}
                      onModelChange={setNewAgentModel}
                      models={models}
                    />
                    <DialogFooter>
                      <Button
                        onClick={handleCreateAgent}
                        disabled={creatingAgent}
                      >
                        {creatingAgent ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Agent'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {agentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No agents yet. Create your first agent to get started.
                  </p>
                  <Button onClick={() => setAgentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-base">
                            {agent.name}
                          </CardTitle>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete agent?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{agent.name}
                                &quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAgent(agent.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {agent.description && (
                        <CardDescription>{agent.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="pt-0 gap-2">
                      <Link href={`/agents/${agent.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          Chat
                        </Button>
                      </Link>
                      <Link href={`/tasks?agentId=${agent.id}`}>
                        <Button variant="outline" size="sm">
                          Assign Task
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Select a company to get started
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              A company is a workspace where you create agents, assign tasks,
              and manage operations. Use the dropdown in the header to select or
              create one.
            </p>
            <Button onClick={() => setCompanyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Company
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
