import { useEffect, useState } from 'react'
import { type Bug, columns } from "./ui/columns"
import { DataTable } from "./ui/dataTable"
// import { EditBugDialog } from "./ediBugDialog"

export default function BugDisplay() { 
  const [data, setData] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchBugs = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/bugs', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bugs: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result.bugs || result || [])
    } catch (err) {
      console.error('Error fetching bugs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bugs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBugs()
  }, [])

  const handleEditBug = (bug: Bug) => {
    console.log('Opening dialog for bug:', bug)
    setSelectedBug(bug)
    setIsDialogOpen(true)
    console.log('Dialog state set to:', true)

  const handleSave = () => {
    fetchBugs() 
  }

  if (loading) {
    return <div className="container mx-auto py-10">Loading bugs...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable 
        columns={columns(handleEditBug)} 
        data={data} 
      />
      
      <EditBugDialog
        bug={selectedBug}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}

interface EditBugDialogProps {
  bug: Bug | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function EditBugDialog({ bug, open, onOpenChange, onSave }: EditBugDialogProps) {
  // Handle the case where bugId might be undefined
  const displayBugId = bug?._id
  const [bugData, setBugData] = useState<Bug | null>(bug)

  const handleSave = () => {
    onSave()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <div>
      {open && (
        <div>
          <h2>Edit Bug {displayBugId}</h2>
          <form>
            <input type="text" value={bugData?.description || ''} onChange={(e) => setBugData({ ...bugData!, description: e.target.value })} />
            {/* <input type="text" value={bugData?.status || ''} onChange={(e) => setBugData({ ...bugData!, status: e.target.value })} /> */}
            <button type="button" onClick={handleSave}>Save</button>
            <button type="button" onClick={handleCancel}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  )
}