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

  const handleViewBug = (bug: Bug) => {
    setSelectedBug(bug)
    setViewDialogOpen(true)
  }

  const handleEditBug = (bug: Bug) => {
    setSelectedBug(bug)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    await fetchBugs()
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

      <ViewBugDialog
        bug={selectedBug}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={() => {
          setViewDialogOpen(false)
          setEditDialogOpen(true)
        }}
      />

      <EditBugDialog
        bug={selectedBug}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}