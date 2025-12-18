import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldLabel,
  FieldGroup,
} from '@/components/ui/field'
import { API_URL } from '@/config'

interface AddBugDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>  // Async function that calls fetchBugs
}

export function AddBugDialog({ open, onOpenChange, onSave }: AddBugDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('Submitting bug:', { title, description})

    try {
      const response = await fetch(`${API_URL}/api/bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description
        }),
      })

      const data = await response.json()
      console.log('Response status:', response.status)
      console.log('Response data:', data)
      console.log('Created bug author:', data.bug?.authorOfBug || data.authorOfBug)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bug')
      }

      console.log('Bug created successfully, refreshing list...')

      // Reset form
      setTitle('')
      setDescription('')
      setError(null)
      
      // IMPORTANT: Call onSave FIRST and wait for it to complete
      console.log('Calling onSave (fetchBugs) to refresh list...')
      console.log('onSave function:', typeof onSave, onSave)
      await onSave()
      console.log('onSave completed, now closing dialog')
      
      // Close dialog AFTER refresh completes
      onOpenChange(false)
      
    } catch (err) {
      console.error('Error adding bug:', err)
      setError(err instanceof Error ? err.message : 'Failed to add bug')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Bug</DialogTitle>
          <DialogDescription>
            Submit a new bug report to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter bug title"
                required
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter bug description"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                required
                disabled={isSubmitting}
              />
            </Field>

          </FieldGroup>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Bug'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}