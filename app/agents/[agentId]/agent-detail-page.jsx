'use client'

import { useCallback, useContext, useEffect, useState } from 'react'

import Link from 'next/link'

import { fetchAgent, updateAgent } from '@/actions/agent'
import { ensureContact } from '@/actions/conversation'
import { AgentForm } from '@/components/agents/agent-form'
import { ChatInputArea } from '@/components/agents/chat-input'
import { ChatMessageList } from '@/components/agents/chat-messages'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ConversationContext } from '@chatbotkit/react'
import ConversationManager from '@chatbotkit/react/components/ConversationManager'

import {
  ArrowLeft,
  Bot,
  Check,
  Loader2,
  MessageSquare,
  Settings,
} from 'lucide-react'

export default function AgentDetailPage({
  agentId,
  endpoint,
  userName,
  userImage,
  models = [],
}) {
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contactId, setContactId] = useState(null)

  // Edit state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBackstory, setEditBackstory] = useState('')
  const [editModel, setEditModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Chat state
  const [conversationKey, setConversationKey] = useState(0)

  useEffect(() => {
    Promise.all([fetchAgent(agentId), ensureContact().catch(() => null)])
      .then(([agentData, cId]) => {
        setAgent(agentData)
        setEditName(agentData.name)
        setEditDescription(agentData.description)
        setEditBackstory(agentData.backstory)
        setEditModel(agentData.model)
        setContactId(cId)
      })
      .catch((err) => console.error('Failed to load agent:', err))
      .finally(() => setLoading(false))
  }, [agentId])

  const handleSave = useCallback(async () => {
    setSaving(true)

    try {
      await updateAgent(agentId, {
        name: editName,
        description: editDescription,
        backstory: editBackstory,
        model: editModel,
      })

      setAgent((prev) => ({
        ...prev,
        name: editName,
        description: editDescription,
        backstory: editBackstory,
        model: editModel,
      }))

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save agent:', err)
    } finally {
      setSaving(false)
    }
  }, [agentId, editName, editDescription, editBackstory, editModel])

  const handleComplete = useCallback(
    (params) => {
      return endpoint({
        ...params,
        botId: agentId,
        contactId,
      })
    },
    [endpoint, agentId, contactId]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Agent not found</p>
        <Link href="/agents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header + Tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <header className="border-b px-4 py-3 flex items-center gap-3 relative">
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{agent.name}</h1>
              {agent.description && (
                <p className="text-xs text-muted-foreground">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <TabsList className="h-9">
              <TabsTrigger value="chat" className="text-xs gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setConversationKey((k) => k + 1)}
          >
            New Chat
          </Button>
        </header>

        {/* Chat tab */}
        <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
          <div className="flex flex-col h-full">
            <ConversationManager
              key={conversationKey}
              endpoint={handleComplete}
            >
              <ChatArea userImage={userImage} userName={userName} />
            </ConversationManager>
          </div>
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="flex-1 min-h-0 mt-0">
          <div className="flex items-center justify-center h-full overflow-auto p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Agent Settings</CardTitle>
                <CardDescription>
                  Edit the agent&apos;s name and backstory to change its
                  behavior.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-2">
                <AgentForm
                  name={editName}
                  onNameChange={setEditName}
                  description={editDescription}
                  onDescriptionChange={setEditDescription}
                  backstory={editBackstory}
                  onBackstoryChange={setEditBackstory}
                  model={editModel}
                  onModelChange={setEditModel}
                  models={models}
                />
              </div>
              <CardFooter>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Chat area that uses ConversationContext from ConversationManager.
 */
function ChatArea({ userImage, userName }) {
  const { thinking, text, setText, message, messages, submit } =
    useContext(ConversationContext)

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {messages.length === 0 && !thinking ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Chat with this agent</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Send a message to start a conversation or assign a task
                directly.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <ChatMessageList
              messages={messages}
              message={message}
              thinking={thinking}
              userImage={userImage}
              userName={userName}
            />
          </div>
        )}
      </ScrollArea>
      <div className="border-t">
        <ChatInputArea
          text={text}
          setText={setText}
          submit={submit}
          thinking={thinking}
        />
      </div>
    </div>
  )
}
