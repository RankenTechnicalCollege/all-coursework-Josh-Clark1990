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
  const [newComment, setNewComment] = useState('')
  const [newTestCase, setNewTestCase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>>([])

  useEffect(() => {
    if (!open) return

    const fetchAssignableUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/assignable-users', {
          credentials: 'include'
        })
        if (response.ok) {
          const users = await response.json()
          setAssignableUsers(users)
        }
      } catch (error) {
        console.error('Error fetching assignable users:', error)
      }
    }

    fetchAssignableUsers()
  }, [open])

  useEffect(() => {
    if (!open) return

    const fetchUserRole = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bugs/me', { 
          credentials: 'include',
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUserRole(userData.role)
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      }
    }
    fetchUserRole()
  }, [open])

  useEffect(() => {
    if (bug) {
      setDescription(bug.description || '')
      setStatusLabel(bug.statusLabel || 'open')
      setAssignedTo(bug.assignedTo || '')
      setStepsToReproduce(bug.stepsToReproduce || '')
      setNewComment('')
      setNewTestCase('')
    }
  }, [bug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bug) return

    try {
      const bugResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}`, {
        method: 'PATCH',
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

      const bugData = await bugResponse.json()

      if (!bugResponse.ok) {
        throw new Error(bugData.message || 'Failed to update bug')
      }

      if (newTestCase.trim() && userRole === 'quality analyst') {
        const testCaseResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}/tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            testCase: newTestCase,
          }),
        })

        if (!testCaseResponse.ok) {
          throw new Error('Failed to add test case')
        }
      }

      setError(null)
      await onSave()
      onOpenChange(false)
      
    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update bug')
    }
  }

  if (!bug) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Bug</DialogTitle>
          <DialogDescription>
            Bug ID: {bug._id}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
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
                <Select value={assignedTo || "unassigned"} onValueChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}>
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select a user to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user._id} value={user.name}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="newComment">Add Comment</FieldLabel>
                <textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a new comment"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                />
              </Field>

              {userRole === 'quality analyst' && (
                <Field>
                  <FieldLabel htmlFor="newTestCase">Add Test Case</FieldLabel>
                  <textarea
                    id="newTestCase"
                    value={newTestCase}
                    onChange={(e) => setNewTestCase(e.target.value)}
                    placeholder="Add a new test case"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                  />
                </Field>
              )}

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
        </div>
      </DialogContent>
    </Dialog>
  )
}