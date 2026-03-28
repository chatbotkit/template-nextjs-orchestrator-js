import { cn } from '@/lib/utils'

import { Check } from 'lucide-react'

/**
 * A card-based model picker that displays each model with a name and optional
 * description. Falls back to a compact single-line layout when no descriptions
 * are present (e.g. when models come from the AGENT_MODELS env var).
 *
 * @param {{ models: { label: string, value: string, description?: string }[], value: string, onChange: (value: string) => void }} props
 */
export function ModelPicker({ models, value, onChange }) {
  const hasDescriptions = models.some((m) => m.description)

  return (
    <div
      className={cn(
        'grid gap-2',
        hasDescriptions ? 'grid-cols-1' : 'grid-cols-2'
      )}
    >
      {models.map((model) => {
        const selected = value === model.value

        return (
          <button
            key={model.value}
            type="button"
            onClick={() => onChange(model.value)}
            className={cn(
              'relative flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
              selected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-input bg-background text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
            )}
          >
            <span className="font-medium text-foreground">{model.label}</span>
            {model.description && (
              <span className="text-xs text-muted-foreground leading-snug">
                {model.description}
              </span>
            )}
            {selected && (
              <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
