// add feature to make it so only editing a bug can be done by author of the bug, the user the bug is assigned to, or technical manager or product manager, other users can only view and comment on the bug or the quality analyst can add
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
  const [classification, setClassification] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [newComment, setNewComment] = useState('')
  const [priority, setPriority] = useState('normal') //'normal' is the default priority
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

  // Fetch user role when dialog opens
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

  const canEditDescription = Boolean(currentUserName && bug?.authorOfBug && currentUserName === bug.authorOfBug)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bug) return

    try {
      // Get current user's ID
      const userResponse = await fetch('http://localhost:5000/api/bugs/me', { 
        credentials: 'include',
      })
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await userResponse.json()
      const userId = userData._id || userData.id

      const updatePayload: any = {
        statusLabel,
        classification,
        assignedTo: assignedTo,
        stepsToReproduce,
      }

      if (canEditDescription) {
        updatePayload.description = description
      }

      const bugResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}`, {
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

      // Add comment if provided
      if (newComment.trim()) {
        const commentResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}/comments`, {
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
      
      //update hours worked if needed
      if (hoursWorked && hoursWorked > 0 && userRole === 'developer') {
        console.log('Updating hours worked:', hoursWorked)
        const hoursWorkedResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}/hours-worked`, {
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

      //Change priority if needed
      if (priority !== bug.priority && (userRole === 'technical manager' || userRole === 'business analyst' || userRole === 'product manager')) {
        const priorityResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}/priority`, {
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

      // Add test case if provided
      if (testCaseTitle.trim() && testCaseDescription.trim() && userRole === 'quality analyst') {
        const testCaseResponse = await fetch(`http://localhost:5000/api/bugs/${bug._id}/tests`, {
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
                  <div className="text-sm text-muted-foreground mt-1">Only the bug author can edit the description.</div>
                )}
              </Field>

              {['developer'].includes(userRole || '') && (
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
                  placeholder="Add comment here"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                />
              </Field>

              {['developer'].includes(userRole || '') && (
                <Field>
                  <FieldLabel htmlFor="hoursWorked">Hours Worked</FieldLabel>
                  <Input
                    id="hoursWorked"
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(Number(e.target.value))}
                  />
                </Field>
              )}

              {['technical manager', 'business analyst', 'product manager'].includes(userRole || '') && (
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


               {['technical manager', 'business analyst', 'product manager'].includes(userRole || '') && (
              <Field>
                <FieldLabel htmlFor="statusLabel">Status</FieldLabel>
                <Select value={statusLabel} onValueChange={setStatusLabel}>
                  <SelectTrigger id="statusLabel">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
               )}

                
               {['technical manager', 'business analyst', 'product manager'].includes(userRole || '') && (
                <Field>
                  <FieldLabel htmlFor ="priority">Priority</FieldLabel>
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

              
               {['technical manager', 'business analyst', 'product manager'].includes(userRole || '') && (
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
              {userRole === 'quality analyst' && (
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