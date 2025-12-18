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
import { Input } from "@/components/ui/input"
import { API_URL } from '@/config'

interface EditBugDialogProps {
  bug: Bug | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => Promise<void>
}

export function EditBugDialog({ bug, open, onOpenChange, onSave }: EditBugDialogProps) {
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [statusLabel, setStatusLabel] = useState('')
  const [classification, setClassification] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [newComment, setNewComment] = useState('')
  const [priority, setPriority] = useState('normal') 
  const [hoursWorked, setHoursWorked] = useState(0)
  
  // Test case fields
  const [testCaseTitle, setTestCaseTitle] = useState('')
  const [testCaseDescription, setTestCaseDescription] = useState('')
  const [testCaseStatus, setTestCaseStatus] = useState('pending')
  
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>>([])

  // Fetch assignable users when dialog opens
  useEffect(() => {
    if (!open) return

    const fetchAssignableUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/assignable-users`, {
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

  // Fetch user role when dialog opens
  useEffect(() => {
    if (!open) return

    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bugs/me`, { 
          credentials: 'include',
        })
        
        if (response.ok) {
              const userData = await response.json()
              setUserRole(userData.role)
              setCurrentUserName(userData.name || null)
            }
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      }
    }
    fetchUserRole()
  }, [open])

  useEffect(() => {
    if (bug && open) {
      setDescription(bug.description || '')
      setStatusLabel(bug.statusLabel || 'open')
      setClassification(bug.classification || 'unapproved')
      setAssignedTo(bug.assignedUserName || '')
      setStepsToReproduce(bug.stepsToReproduce || '')
      setNewComment('')
      setPriority(bug.priority || 'normal')
      setHoursWorked(0)
      
      // Reset test case fields
      setTestCaseTitle('')
      setTestCaseDescription('')
      setTestCaseStatus('pending')
      
      setError(null)
    }
  }, [bug, open])

  // Permission checks
  const isAuthor = Boolean(currentUserName && bug?.authorOfBug && currentUserName === bug.authorOfBug)
  const isAssignedDeveloper = Boolean(currentUserName && bug?.assignedUserName && currentUserName === bug.assignedUserName)
  const isUser = userRole === 'user'
  const isDeveloper = userRole === 'developer'
  
  // Users can ONLY edit their own bugs (not bugs assigned to them)
  // Other roles can edit bugs they created OR bugs assigned to them
  const canEditBug = isUser ? isAuthor : (isAuthor || isAssignedDeveloper)
  
  const isTechOrProductManager = ['technical manager', 'product manager'].includes(userRole || '')
  const isBusinessAnalyst = userRole === 'business analyst'
  const isQualityAnalyst = userRole === 'quality analyst'
  
  // Field-specific permissions
  const canEditDescription = canEditBug 
  const canEditStepsToReproduce = !isUser && canEditBug 
  const canEditHoursWorked = !isUser && isDeveloper && (isAuthor || isAssignedDeveloper)
  const canEditStatus = !isUser && (canEditBug || isBusinessAnalyst) 
  const canEditClassification = isTechOrProductManager
  const canEditPriority = isTechOrProductManager
  const canEditAssignedTo = isTechOrProductManager

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bug) return

    try {
      // Get current user's ID
      const userResponse = await fetch(`${API_URL}/api/bugs/me`, { 
        credentials: 'include',
      })
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await userResponse.json()
      const userId = userData._id || userData.id

      const updatePayload: Partial<{
        description: string
        stepsToReproduce: string
        statusLabel: string
        classification: string
        assignedTo: string
      }> = {}

      // Only include fields user has permission to change
      if (canEditDescription) {
        updatePayload.description = description
      }

      if (canEditStepsToReproduce) {
        updatePayload.stepsToReproduce = stepsToReproduce
      }

      if (canEditStatus) {
        // Business analysts can only mark as resolved
        if (isBusinessAnalyst && !canEditBug) {
          if (statusLabel === 'resolved') {
            updatePayload.statusLabel = statusLabel
          } else {
            throw new Error('Business analysts can only mark bugs as resolved')
          }
        } else {
          updatePayload.statusLabel = statusLabel
        }
      }

      if (canEditClassification) {
        updatePayload.classification = classification
      }

      if (canEditAssignedTo) {
        updatePayload.assignedTo = assignedTo
      }

      // Only send update if there are fields to update
      if (Object.keys(updatePayload).length > 0) {
        const bugResponse = await fetch(`${API_URL}/api/bugs/${bug._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatePayload),
        })

        const bugData = await bugResponse.json()

        if (!bugResponse.ok) {
          throw new Error(bugData.message || 'Failed to update bug')
        }
      }

      // Add comment if provided (anyone can comment)
      if (newComment.trim()) {
        const commentResponse = await fetch(`${API_URL}/api/bugs/${bug._id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user_id: userId,
            text: newComment.trim(),
          }),
        })

        if (!commentResponse.ok) {
          const commentData = await commentResponse.json().catch(() => ({}))
          throw new Error(commentData.message || 'Failed to add comment')
        }
      }
      
      // Update hours worked if needed (only developers on bugs they authored or are assigned to)
      if (hoursWorked && hoursWorked > 0 && canEditHoursWorked) {
        console.log('Updating hours worked:', hoursWorked)
        const hoursWorkedResponse = await fetch(`${API_URL}/api/bugs/${bug._id}/hours-worked`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ hoursWorked }),
        })
        
        if (!hoursWorkedResponse.ok) {
          const hoursData = await hoursWorkedResponse.json().catch(() => ({}))
          throw new Error(hoursData.message || 'Failed to update hours worked')
        }
      }

      // Change priority if needed (only tech/product managers)
      if (priority !== bug.priority && canEditPriority) {
        const priorityResponse = await fetch(`${API_URL}/api/bugs/${bug._id}/priority`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ priority }),
        })

        if (!priorityResponse.ok) {
          const priorityData = await priorityResponse.json().catch(() => ({}))
          throw new Error(priorityData.message || 'Failed to update priority')
        }
      }

      // Add test case if provided (only quality analysts)
      if (testCaseTitle.trim() && testCaseDescription.trim() && isQualityAnalyst) {
        const testCaseResponse = await fetch(`${API_URL}/api/bugs/${bug._id}/tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: testCaseTitle.trim(),
            description: testCaseDescription.trim(),
            status: testCaseStatus,
            user_id: userId,
          }),
        })

        if (!testCaseResponse.ok) {
          const testData = await testCaseResponse.json().catch(() => ({}))
          throw new Error(testData.message || 'Failed to add test case')
        }
      }

      setError(null)
      
      // Close dialog first
      onOpenChange(false)
      
      // Then trigger refresh
      await onSave()
      
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
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
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
                  readOnly={!canEditDescription}
                  className={`w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 ${!canEditDescription ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {!canEditDescription && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Only the bug author {!isUser && 'or assigned developer'} can edit the description.
                  </div>
                )}
              </Field>

              {canEditStepsToReproduce && (
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
              )}

              <Field>
                <FieldLabel htmlFor="newComment">Add Comment</FieldLabel>
                <textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add comment here (anyone can comment)"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                />
              </Field>

              {canEditHoursWorked && (
                <Field>
                  <FieldLabel htmlFor="hoursWorked">Hours Worked</FieldLabel>
                  <Input
                    id="hoursWorked"
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(Number(e.target.value))}
                    min="0"
                    step="0.5"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Only developers can update hours worked on bugs they authored or are assigned to.
                  </div>
                </Field>
              )}

              {canEditClassification && (
                <Field>
                  <FieldLabel htmlFor="classification">Classification</FieldLabel>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger id="classification">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="unapproved">Unapproved</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {canEditStatus && (
                <Field>
                  <FieldLabel htmlFor="statusLabel">Status</FieldLabel>
                  <Select value={statusLabel} onValueChange={setStatusLabel}>
                    <SelectTrigger id="statusLabel">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show all options for author/assigned dev, only 'resolved' for business analysts */}
                      {canEditBug ? (
                        <>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="resolved">Resolved</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {isBusinessAnalyst && !canEditBug && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Business analysts can only mark bugs as resolved.
                    </div>
                  )}
                </Field>
              )}

              {canEditPriority && (
                <Field>
                  <FieldLabel htmlFor="priority">Priority</FieldLabel>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {canEditAssignedTo && (
                <Field>
                  <FieldLabel htmlFor="assignedTo">Assigned To</FieldLabel>
                  {assignableUsers.length === 0 ? (
                    <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                      Loading users...
                    </div>
                  ) : (
                    <Select 
                      value={assignedTo || "unassigned"} 
                      onValueChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}
                    >
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
                  )}
                </Field>
              )}

              {/* Test Case Section - Only for Quality Analysts */}
              {isQualityAnalyst && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Add Test Case</h3>
                    
                    <Field>
                      <FieldLabel htmlFor="testCaseTitle">Test Case Title</FieldLabel>
                      <Input
                        id="testCaseTitle"
                        type="text"
                        value={testCaseTitle}
                        onChange={(e) => setTestCaseTitle(e.target.value)}
                        placeholder="e.g., Verify login functionality"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="testCaseDescription">Test Case Description</FieldLabel>
                      <textarea
                        id="testCaseDescription"
                        value={testCaseDescription}
                        onChange={(e) => setTestCaseDescription(e.target.value)}
                        placeholder="Detailed test case steps and expected results"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="testCaseStatus">Test Status</FieldLabel>
                      <Select value={testCaseStatus} onValueChange={setTestCaseStatus}>
                        <SelectTrigger id="testCaseStatus">
                          <SelectValue placeholder="Select test status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </>
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