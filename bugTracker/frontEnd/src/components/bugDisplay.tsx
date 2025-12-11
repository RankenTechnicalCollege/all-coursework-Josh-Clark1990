import { useEffect, useState } from 'react'
import { type Bug, columns } from "./ui/columns"
import { DataTable } from "./ui/dataTable"
import { ViewBugDialog } from "./viewBugInfoDialog"
import { EditBugDialog } from "./editBugDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, RefreshCw } from "lucide-react"

export default function BugDisplay() { 
  const [data, setData] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Search and filter states
  const [searchKeywords, setSearchKeywords] = useState('')
  const [classification, setClassification] = useState<string>('')
  const [closedFilter, setClosedFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('')
  const [showMyBugs, setShowMyBugs] = useState(false)

  const fetchBugs = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      
      if (searchKeywords) params.append('keywords', searchKeywords)
      if (classification && classification !== 'all') params.append('classification', classification)
      if (closedFilter && closedFilter !== 'all') params.append('closed', closedFilter)
      if (sortBy && sortBy !== 'all') params.append('sortBy', sortBy)
      if (sortOrder && sortOrder !== 'all') params.append('order', sortOrder)
      if (showMyBugs) params.append('assignedToMe', 'true')

      const response = await fetch(`http://localhost:5000/api/bugs?${params.toString()}`, {
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

  // Fetch bugs when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBugs()
  }, [searchKeywords, classification, closedFilter, sortBy, sortOrder, showMyBugs])

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

  const clearFilters = () => {
    setSearchKeywords('')
    setClassification('')
    setClosedFilter('')
    setSortBy('')
    setSortOrder('')
    setShowMyBugs(false)
  }

  const hasActiveFilters = searchKeywords || 
                      (classification && classification !== '') || 
                      (closedFilter && closedFilter !== '') || 
                      (sortBy && sortBy !== '') ||
                      (sortOrder && sortOrder !== '') ||
                      showMyBugs

  if (loading && !data.length) {
    return <div className="container mx-auto py-10">Loading bugs...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-red-500 text-center">
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            onClick={() => {
              setError(null)
              fetchBugs()
            }}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bugs by title or author..."
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* My Bugs Button */}
          <Button
            variant={showMyBugs ? "default" : "outline"}
            onClick={() => setShowMyBugs(!showMyBugs)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {showMyBugs ? "Showing My Bugs" : "Show My Bugs"}
          </Button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* Classification Filter */}
          <Select value={classification} onValueChange={setClassification}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unclassified">Unclassified</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="unapproved">Unapproved</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={closedFilter} onValueChange={setClosedFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Open</SelectItem>
              <SelectItem value="true">Closed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="classification">Classification</SelectItem>
              <SelectItem value="statusLabel">Status</SelectItem>
              <SelectItem value="assignedUserName">Assigned To</SelectItem>
              <SelectItem value="authorOfBug">Author</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `Found ${data.length} bug${data.length !== 1 ? 's' : ''}`}
          {showMyBugs && !loading && ' assigned to you'}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns(handleViewBug, handleEditBug)}
        data={data}
      />

      {/* Dialogs */}
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