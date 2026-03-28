'use client'

import { useCallback, useContext, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { listAgents } from '@/actions/agent'
import { listCompanies } from '@/actions/company'
import { dispatchTask } from '@/actions/task'
import { ChatMessageList } from '@/components/agents/chat-messages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { ConversationContext } from '@chatbotkit/react'
import ConversationManager from '@chatbotkit/react/components/ConversationManager'

import {
  ArrowLeft,
  Bot,
  Calendar,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECURRING_INTERVALS = [
  { label: 'Every 15 minutes', value: '15min', ms: 15 * 60 * 1000 },
  { label: 'Every 30 minutes', value: '30min', ms: 30 * 60 * 1000 },
  { label: 'Every hour', value: '1h', ms: 60 * 60 * 1000 },
  { label: 'Every 4 hours', value: '4h', ms: 4 * 60 * 60 * 1000 },
  { label: 'Every 8 hours', value: '8h', ms: 8 * 60 * 60 * 1000 },
  { label: 'Every day', value: '24h', ms: 24 * 60 * 60 * 1000 },
]

const STORAGE_KEY_SCHEDULED = 'cbk_scheduled_tasks'
const STORAGE_KEY_RECURRING = 'cbk_recurring_tasks'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatDateTime(iso) {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function minDateTimeLocal() {
  const d = new Date(Date.now() + 60_000)
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TasksPage({ userName, userImage }) {
  const searchParams = useSearchParams()
  const preselectedAgentId = searchParams.get('agentId')

  const [allAgents, setAllAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('run')
  const [selectedAgentId, setSelectedAgentId] = useState(
    preselectedAgentId || null
  )
  const [taskDescription, setTaskDescription] = useState('')

  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduledTasks, setScheduledTasks] = useState([])
  const scheduledTasksRef = useRef([])

  const [recurringInterval, setRecurringInterval] = useState('1h')
  const [recurringTasks, setRecurringTasks] = useState([])
  const recurringTasksRef = useRef([])

  const [taskRunning, setTaskRunning] = useState(false)
  const [taskKey, setTaskKey] = useState(0)
  const runningTaskRef = useRef(null)

  const applyScheduledTasks = useCallback((fn) => {
    const next = fn(scheduledTasksRef.current)
    scheduledTasksRef.current = next
    setScheduledTasks(next)
    saveStorage(STORAGE_KEY_SCHEDULED, next)
  }, [])

  const applyRecurringTasks = useCallback((fn) => {
    const next = fn(recurringTasksRef.current)
    recurringTasksRef.current = next
    setRecurringTasks(next)
    saveStorage(STORAGE_KEY_RECURRING, next)
  }, [])

  useEffect(() => {
    const scheduled = loadStorage(STORAGE_KEY_SCHEDULED)
    const recurring = loadStorage(STORAGE_KEY_RECURRING)
    scheduledTasksRef.current = scheduled
    recurringTasksRef.current = recurring
    setScheduledTasks(scheduled)
    setRecurringTasks(recurring)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const comps = await listCompanies()
        const agentsByCompany = await Promise.all(
          comps.map(async (c) => {
            const agents = await listAgents(c.id)
            return agents.map((a) => ({
              ...a,
              companyId: c.id,
              companyName: c.name,
            }))
          })
        )
        const flat = agentsByCompany.flat()
        setAllAgents(flat)
        if (!selectedAgentId && flat.length > 0) {
          setSelectedAgentId(flat[0].id)
        }
      } catch (err) {
        console.error('Failed to load agents:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerTask = useCallback((agentId, description) => {
    runningTaskRef.current = { agentId, description }
    setTaskRunning(true)
    setTaskKey((k) => k + 1)
    setActiveTab('run')
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()

      const dueTasks = scheduledTasksRef.current.filter(
        (t) =>
          t.status === 'pending' && new Date(t.scheduledAt).getTime() <= now
      )
      if (dueTasks.length > 0) {
        applyScheduledTasks((prev) =>
          prev.map((t) =>
            dueTasks.some((d) => d.id === t.id)
              ? { ...t, status: 'triggered' }
              : t
          )
        )
        triggerTask(dueTasks[0].agentId, dueTasks[0].description)
      }

      const dueRecurring = recurringTasksRef.current.filter(
        (t) => t.enabled && new Date(t.nextRunAt).getTime() <= now
      )
      if (dueRecurring.length > 0) {
        applyRecurringTasks((prev) =>
          prev.map((t) => {
            if (!dueRecurring.some((d) => d.id === t.id)) {
              return t
            }
            const ivConfig = RECURRING_INTERVALS.find(
              (i) => i.value === t.intervalValue
            )
            return {
              ...t,
              lastRunAt: new Date().toISOString(),
              nextRunAt: new Date(now + ivConfig.ms).toISOString(),
            }
          })
        )
        if (dueTasks.length === 0) {
          triggerTask(dueRecurring[0].agentId, dueRecurring[0].description)
        }
      }
    }, 15_000)

    return () => clearInterval(id)
  }, [triggerTask, applyScheduledTasks, applyRecurringTasks])

  const handleRunNow = useCallback(() => {
    if (!selectedAgentId || !taskDescription.trim()) {
      return
    }
    triggerTask(selectedAgentId, taskDescription)
  }, [selectedAgentId, taskDescription, triggerTask])

  const handleScheduleTask = useCallback(() => {
    if (!selectedAgentId || !taskDescription.trim() || !scheduledAt) {
      return
    }
    const agent = allAgents.find((a) => a.id === selectedAgentId)
    const task = {
      id: newId(),
      agentId: selectedAgentId,
      agentName: agent?.name || '',
      description: taskDescription,
      scheduledAt: new Date(scheduledAt).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    applyScheduledTasks((prev) => [task, ...prev])
    setTaskDescription('')
    setScheduledAt('')
  }, [
    selectedAgentId,
    taskDescription,
    scheduledAt,
    allAgents,
    applyScheduledTasks,
  ])

  const handleDeleteScheduledTask = useCallback(
    (id) => {
      applyScheduledTasks((prev) => prev.filter((t) => t.id !== id))
    },
    [applyScheduledTasks]
  )

  const handleAddRecurring = useCallback(() => {
    if (!selectedAgentId || !taskDescription.trim()) {
      return
    }
    const agent = allAgents.find((a) => a.id === selectedAgentId)
    const ivConfig = RECURRING_INTERVALS.find(
      (i) => i.value === recurringInterval
    )
    const task = {
      id: newId(),
      agentId: selectedAgentId,
      agentName: agent?.name || '',
      description: taskDescription,
      intervalValue: recurringInterval,
      intervalLabel: ivConfig.label,
      nextRunAt: new Date(Date.now() + ivConfig.ms).toISOString(),
      lastRunAt: null,
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    applyRecurringTasks((prev) => [task, ...prev])
    setTaskDescription('')
  }, [
    selectedAgentId,
    taskDescription,
    recurringInterval,
    allAgents,
    applyRecurringTasks,
  ])

  const handleToggleRecurring = useCallback(
    (id) => {
      applyRecurringTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
      )
    },
    [applyRecurringTasks]
  )

  const handleDeleteRecurringTask = useCallback(
    (id) => {
      applyRecurringTasks((prev) => prev.filter((t) => t.id !== id))
    },
    [applyRecurringTasks]
  )

  const taskEndpoint = useCallback(() => {
    const { agentId, description } = runningTaskRef.current || {}
    return dispatchTask({ botId: agentId, task: description })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const agentSelector = (
    <div className="space-y-2">
      <Label htmlFor="task-agent">Agent</Label>
      {allAgents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agents available. Create agents in a company first.
        </p>
      ) : (
        <Select
          id="task-agent"
          value={selectedAgentId || ''}
          onChange={(e) => setSelectedAgentId(e.target.value)}
        >
          {allAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.companyName})
            </option>
          ))}
        </Select>
      )}
    </div>
  )

  const taskDescriptionField = (
    <div className="space-y-2">
      <Label htmlFor="task-desc">Task description</Label>
      <Textarea
        id="task-desc"
        placeholder="e.g. Research the latest trends in AI and create a summary report..."
        rows={4}
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
      />
    </div>
  )

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
          <h1 className="text-base font-semibold">Tasks</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="run">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run now
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Recurring
            </TabsTrigger>
          </TabsList>

          {/* ---- Run Now ---- */}
          <TabsContent value="run" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Run a task</CardTitle>
                <CardDescription>
                  Assign a task to an agent and see the output immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentSelector}
                {taskDescriptionField}
                <Button
                  onClick={handleRunNow}
                  disabled={!selectedAgentId || !taskDescription.trim()}
                  size="sm"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Run task
                </Button>
              </CardContent>
            </Card>

            {taskRunning && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Output
                    {runningTaskRef.current?.agentId && (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        -{' '}
                        {allAgents.find(
                          (a) => a.id === runningTaskRef.current.agentId
                        )?.name || 'Agent'}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConversationManager key={taskKey} endpoint={taskEndpoint}>
                    <TaskOutput userName={userName} userImage={userImage} />
                  </ConversationManager>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---- Schedule Once ---- */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule a task</CardTitle>
                <CardDescription>
                  The task will run automatically at the specified date and
                  time. Scheduled tasks are stored locally and require this page
                  to be open.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentSelector}
                {taskDescriptionField}
                <div className="space-y-2">
                  <Label htmlFor="scheduled-at">Run at</Label>
                  <Input
                    id="scheduled-at"
                    type="datetime-local"
                    min={minDateTimeLocal()}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleScheduleTask}
                  disabled={
                    !selectedAgentId || !taskDescription.trim() || !scheduledAt
                  }
                  size="sm"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Schedule task
                </Button>
              </CardContent>
            </Card>

            {scheduledTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scheduled tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {task.description}
                          </span>
                          <Badge
                            variant={
                              task.status === 'triggered'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {task.status === 'triggered'
                              ? 'Triggered'
                              : 'Pending'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                          <Bot className="h-3 w-3" />
                          {task.agentName}
                          <span className="mx-1">·</span>
                          <Clock className="h-3 w-3" />
                          {formatDateTime(task.scheduledAt)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => handleDeleteScheduledTask(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---- Recurring ---- */}
          <TabsContent value="recurring" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Create a recurring task
                </CardTitle>
                <CardDescription>
                  The task will run on a repeating schedule. Recurring tasks are
                  stored locally and require this page to be open.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentSelector}
                {taskDescriptionField}
                <div className="space-y-2">
                  <Label htmlFor="recurring-interval">Repeat</Label>
                  <Select
                    id="recurring-interval"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value)}
                  >
                    {RECURRING_INTERVALS.map((iv) => (
                      <option key={iv.value} value={iv.value}>
                        {iv.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleAddRecurring}
                  disabled={!selectedAgentId || !taskDescription.trim()}
                  size="sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Add recurring task
                </Button>
              </CardContent>
            </Card>

            {recurringTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recurring tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recurringTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {task.description}
                          </span>
                          <Badge
                            variant={task.enabled ? 'default' : 'secondary'}
                          >
                            {task.enabled ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                          <Bot className="h-3 w-3" />
                          {task.agentName}
                          <span className="mx-1">·</span>
                          <RefreshCw className="h-3 w-3" />
                          {task.intervalLabel}
                          {task.enabled && (
                            <>
                              <span className="mx-1">·</span>
                              Next: {formatDateTime(task.nextRunAt)}
                            </>
                          )}
                          {task.lastRunAt && (
                            <>
                              <span className="mx-1">·</span>
                              Last: {formatDateTime(task.lastRunAt)}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleToggleRecurring(task.id)}
                        >
                          {task.enabled ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDeleteRecurringTask(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function TaskOutput({ userName, userImage }) {
  const { thinking, message, messages } = useContext(ConversationContext)

  return (
    <div>
      {messages.length === 0 && thinking ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Agent is working on the task...
        </div>
      ) : (
        <ChatMessageList
          messages={messages}
          message={message}
          thinking={thinking}
          userImage={userImage}
          userName={userName}
        />
      )}
    </div>
  )
}
