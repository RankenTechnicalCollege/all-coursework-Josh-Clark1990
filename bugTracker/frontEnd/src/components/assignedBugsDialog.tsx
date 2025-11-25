import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AssignedBugCard, type Bug } from '@/components/ui/assignedBugCard'
import { ScrollArea } from '@/components/ui/scroll-area'

interface User {
  _id: string
  name?: string
  email?: string
  assignedBugs?: string[]
}

interface AssignedBugsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewBugDetails?: (bug: Bug) => void
}

export function AssignedBugsDialog({
  user,
  open,
  onOpenChange,
  onViewBugDetails
}: AssignedBugsDialogProps) {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && user?.assignedBugs && user.assignedBugs.length > 0) {
      fetchAssignedBugs()
    }
  }, [open, user])

  const fetchAssignedBugs = async () => {
    if (!user?.assignedBugs) return

    try {
      setLoading(true)
      setError(null)

      // Fetch each bug by ID
      const bugPromises = user.assignedBugs.map(async (bugId) => {
        const response = await fetch(`http://localhost:5000/api/bugs/${bugId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch bug ${bugId}`)
        }

        return response.json()
      })

      const fetchedBugs = await Promise.all(bugPromises)
      setBugs(fetchedBugs)
    } catch (err) {
      console.error('Error fetching assigned bugs:', err)
      setError('Failed to load assigned bugs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assigned Bugs</DialogTitle>
          <DialogDescription>
            Bugs assigned to {user?.name || user?.email || 'this user'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading assigned bugs...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && bugs.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No bugs assigned</p>
          </div>
        )}

        {!loading && !error && bugs.length > 0 && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {bugs.map((bug) => (
                <AssignedBugCard
                  key={bug._id}
                  bug={bug}
                  onViewDetails={onViewBugDetails}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}