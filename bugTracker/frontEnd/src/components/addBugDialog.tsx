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

interface AddBugDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function AddBugDialog({ open, onOpenChange, onSave }: AddBugDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          stepsToReproduce,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit bug')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setStepsToReproduce('')
      setError(null)
      
      onSave()
      onOpenChange(false)
    } catch (err) {
      console.error('Error adding bug:', err)
      setError('Failed to add bug')
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
            <div className="mb-4 text-sm text-red-600">
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
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="stepsToReproduce">Steps to Reproduce</FieldLabel>
              <textarea
                id="stepsToReproduce"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="Enter steps taken to reproduce the bug"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                required
              />
            </Field>

          </FieldGroup>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Submit Bug
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}