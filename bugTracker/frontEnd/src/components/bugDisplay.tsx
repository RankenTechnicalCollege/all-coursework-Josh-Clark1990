import { useEffect, useState } from 'react'
import { type Bug, columns } from "./ui/columns"
import { DataTable } from "./ui/dataTable"
import { ViewBugDialog } from "./viewBugInfoDialog"
import { EditBugDialog } from "./ediBugDialog"

export default function BugDisplay() { 
  const [data, setData] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  
  // Separate dialog states for view and edit
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  // Handler for viewing bug (Bug ID link)
  const handleViewBug = (bug: Bug) => {
    console.log('Opening view dialog for bug:', bug)
    setSelectedBug(bug)
    setViewDialogOpen(true)
  }

  // Handler for editing bug (Edit button)
  const handleEditBug = (bug: Bug) => {
    console.log('Opening edit dialog for bug:', bug)
    setSelectedBug(bug)
    setEditDialogOpen(true)
  }

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
        columns={columns(handleViewBug, handleEditBug)}
        data={data}
      />

      {/* View Dialog - for Bug ID clicks */}
      <ViewBugDialog
        bug={selectedBug}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={() => {
          // Switch from view to edit
          setViewDialogOpen(false)
          setEditDialogOpen(true)
        }}
      />

      {/* Edit Dialog - for Edit button clicks */}
      <EditBugDialog
        bug={selectedBug}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}