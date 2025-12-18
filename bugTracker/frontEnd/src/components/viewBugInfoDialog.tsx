// components/view-bug-dialog.tsx
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
import { Badge } from "@/components/ui/badge"
import { API_URL } from '@/config'

interface ViewBugDialogProps {
  bug: Bug | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
}

interface Comment {
  _id: string
  text: string
  author: string
  authorName: string
  createdAt: string
  title: string
  statusLabel: string
  classification: string
  assignedTo: string
  comments: string[]
  testCase: string[]
}

interface TestCase {
  _id: string
  testCase: string
  author: string
  createdAt: string
  authorName: string
  description: string
  status: string
  assignedTo: string
}

// Helper function to format date and time
const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr}, at ${timeStr}`;
};

export function ViewBugDialog({ bug, open, onOpenChange, onEdit }: ViewBugDialogProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBugDetails = async () => {
      if (!bug) return

      setLoading(true)
      try {
        // Fetch comments
        const commentsRes = await fetch(`${API_URL}/api/bugs/${bug._id}/comments`, {
          credentials: 'include',
        })
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setComments(commentsData)
        }

        // Fetch test cases
        const testsRes = await fetch(`${API_URL}/api/bugs/${bug._id}/tests`, {
          credentials: 'include',
        })
        if (testsRes.ok) {
          const testsData = await testsRes.json()
          setTestCases(testsData)
        }
      } catch (err) {
        console.error('Failed to fetch bug details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (bug && open) {
      fetchBugDetails()
    }
  }, [bug, open])

  if (!bug) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500'
      case 'resolved':
        return 'bg-green-500'
      case 'closed':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Bug Details</DialogTitle>
              <DialogDescription>
                Bug ID: {bug._id}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button onClick={onEdit} size="sm">
                Edit Bug
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <Badge className={getStatusColor(bug.statusLabel || 'open')}>
                {bug.statusLabel || 'open'}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-sm">{bug.description || 'No description provided'}</p>
            </div>

            {/* Steps to Reproduce */}
            {bug.stepsToReproduce && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Steps to Reproduce</h3>
                <p className="text-sm whitespace-pre-wrap">{bug.stepsToReproduce}</p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date Created</h3>
              <p className="text-sm">
                {bug.createdAt 
                  ? new Date(bug.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'No date provided'
                }
              </p>
            </div>

            {/* Assigned User */}    
            {bug.assignedUserName && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                <p className="text-sm">{bug.assignedUserName}</p>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Comments ({comments.length})
              </h3>
              {loading ? (
                <p className="text-sm text-gray-500">Loading comments...</p>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">
                          Commented {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Comment id:{comment._id}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No comments yet</p>
              )}
            </div>

            {/* Test Cases */}
            {testCases.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Test Cases ({testCases.length})
                </h3>
                <div className="space-y-3">
                  {testCases.map((test) => (
                    <div
                      key={test._id}
                      className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">Tested by {test.authorName}</span>
                        <span className="text-sm font-medium">Test Status: {test.status}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {test.description}
                      </p>
                      <span className="text-xs text-gray-500">
                        Tested on {formatDateTime(test.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}