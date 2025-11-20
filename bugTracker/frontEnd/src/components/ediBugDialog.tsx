// components/edit-bug-dialog.tsx
import { useState, useEffect } from 'react'
import { type Bug } from './ui/columns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditBugDialogProps {
  bug: Bug | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function EditBugDialog({ bug, open, onOpenChange, onSave }: EditBugDialogProps) {
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [statusLabel, setStatusLabel] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Update form when bug changes
  useEffect(() => {
    if (bug) {
      
      setDescription(bug.description || '')
      setStatusLabel(bug.statusLabel || 'open')
      setAssignedTo(bug.assignedTo || '')
      setStepsToReproduce(bug.stepsToReproduce || '')
    }
  }, [bug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bug) return

    try {
      const response = await fetch(`http://localhost:5000/api/bugs/${bug._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          description,
          statusLabel,
          assignedTo,
          stepsToReproduce,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update bug')
      }

      setError(null)
      onSave() // Refresh bug list
      onOpenChange(false) // Close dialog
      
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update bug')
    }
  }

  if (!bug) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Bug</DialogTitle>
          <DialogDescription>
            Bug ID: {bug._id}
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
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bug description"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="stepsToReproduce">Steps to Reproduce</FieldLabel>
              <textarea
                id="stepsToReproduce"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="Steps to reproduce the bug"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="statusLabel">Status</FieldLabel>
              <Select value={statusLabel} onValueChange={setStatusLabel}>
                <SelectTrigger id="statusLabel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="assignedTo">Assigned To</FieldLabel>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Assignee name"
              />
            </Field>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )}