'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModelPicker } from '@/components/ui/model-picker'
import { Textarea } from '@/components/ui/textarea'

/**
 * Shared form fields for creating or editing an agent.
 *
 * @param {{ name: string, onNameChange: (v: string) => void, description: string, onDescriptionChange: (v: string) => void, backstory: string, onBackstoryChange: (v: string) => void, model: string, onModelChange: (v: string) => void, models: { label: string, value: string, description?: string }[] }} props
 */
export function AgentForm({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  backstory,
  onBackstoryChange,
  model,
  onModelChange,
  models = [],
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agent-name">Name</Label>
        <Input
          id="agent-name"
          placeholder="e.g. Research Assistant"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="agent-desc">Description</Label>
        <Input
          id="agent-desc"
          placeholder="What does this agent do?"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="agent-backstory">Backstory</Label>
        <Textarea
          id="agent-backstory"
          placeholder="You are a research assistant that helps find and analyze information..."
          rows={4}
          value={backstory}
          onChange={(e) => onBackstoryChange(e.target.value)}
        />
      </div>
      {models.length > 0 && (
        <div className="space-y-2">
          <Label>Model</Label>
          <ModelPicker models={models} value={model} onChange={onModelChange} />
        </div>
      )}
    </div>
  )
}
