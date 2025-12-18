import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type Bug, columns } from "./ui/columns"
import { DataTable } from "./ui/dataTable"
import { ViewBugDialog } from "./viewBugInfoDialog"
import { EditBugDialog } from "./editBugDialog"
import { AddBugDialog } from './addBugDialog'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, RefreshCw, LucideArrowBigLeft, LucideArrowBigRight } from "lucide-react"
import { API_URL } from '@/config'

export default function BugDisplay() { 
  const [data, setData] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userInfoLoaded, setUserInfoLoaded] = useState(false)

  // URL params for add bug dialog
  const [searchParams, setSearchParams] = useSearchParams()
  const addBugOpen = searchParams.get('addBug') === 'true'

  // Search and filter states - DEFAULT SORT TO NEWEST FIRST
  const [searchKeywords, setSearchKeywords] = useState('')
  const [classification, setClassification] = useState<string>('')
  const [closedFilter, setClosedFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')  // Default sort field
  const [sortOrder, setSortOrder] = useState<string>('desc')  // Default to descending (newest first)
  const [showMyBugs, setShowMyBugs] = useState(false)
  const [priority, setPriority] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [, forceUpdate] = useState(0)  // Force re-render trigger
  
  // Pagination configuration
  const itemsPerPage = 10
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  // Handle add bug dialog
  const setAddBugOpen = (open: boolean) => {
    if (open) {
      searchParams.set('addBug', 'true')
    } else {
      searchParams.delete('addBug')
    }
    setSearchParams(searchParams)
  }

  const fetchBugs = async () => {
    console.log('fetchBugs starting...')
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('limit', '1000')
      
      if (searchKeywords) params.append('keywords', searchKeywords)
      if (classification && classification !== 'all') params.append('classification', classification)
      if (closedFilter && closedFilter !== 'all') params.append('closed', closedFilter)
      if (sortBy && sortBy !== 'all') params.append('sortBy', sortBy)
      if (sortOrder && sortOrder !== 'all') params.append('order', sortOrder)
      if (showMyBugs) params.append('assignedToMe', 'true')
      if (priority && priority !== 'all') params.append('priority', priority)

      const response = await fetch(`${API_URL}/api/bugs?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bugs: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // For "user" role, filter to only bugs they authored
      let bugs = result.bugs || result || []
      console.log('Total bugs from API:', bugs.length)
      console.log('Current userRole:', userRole, 'userName:', userName)
      
      if (userRole === 'user' && userName) {
        bugs = bugs.filter((bug: Bug) => bug.authorOfBug === userName)

      }
      

      setData([...bugs])  // Create new array reference to ensure React detects change
    } catch (err) {
      console.error('Error fetching bugs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bugs')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user role and name on mount - THIS MUST COMPLETE FIRST
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bugs/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUserRole(userData.role || null)
          setUserName(userData.name || null)
          console.log('User info loaded:', userData.role, userData.name)
        }
      } catch (err) {
        console.error('Error fetching user info:', err)
      } finally {
        setUserInfoLoaded(true)
      }
    }
    
    fetchUserInfo()
  }, [])

  // Fetch bugs ONLY after user info is loaded
  useEffect(() => {
    if (userInfoLoaded) {
      console.log('useEffect triggered - fetching bugs with role:', userRole)
      fetchBugs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoLoaded, searchKeywords, classification, closedFilter, sortBy, sortOrder, showMyBugs, userRole, userName, priority])

  // Debug: Log when data state changes
  useEffect(() => {
    console.log('DATA STATE CHANGED! New data length:', data.length)
  }, [data])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeywords, classification, closedFilter, sortBy, sortOrder, showMyBugs, priority])

  const handleViewBug = (bug: Bug) => {
    setSelectedBug(bug)
    setViewDialogOpen(true)
  }

  const handleEditBug = (bug: Bug) => {
    setSelectedBug(bug)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    console.log('=== handleSave CALLED ===')
    await fetchBugs()
    console.log('=== fetchBugs COMPLETED ===')
    forceUpdate(n => n + 1)  // Force re-render
  }

  const clearFilters = () => {
    setSearchKeywords('')
    setClassification('')
    setClosedFilter('')
    setSortBy('createdAt')  // Reset to default sort
    setSortOrder('desc')     // Reset to default order
    setShowMyBugs(false)
    setPriority('')
  }

  const hasActiveFilters = searchKeywords || 
                      (classification && classification !== '') || 
                      (closedFilter && closedFilter !== '') || 
                      (sortBy && sortBy !== 'createdAt') ||  // Changed: createdAt is now default
                      (sortOrder && sortOrder !== 'desc') ||  // Changed: desc is now default
                      showMyBugs ||
                      priority

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

  console.log('=== RENDER: handleSave is:', handleSave)
console.log('=== RENDER: setAddBugOpen is:', setAddBugOpen)

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

          {/* Priority Filter */}
          <Button
            variant={priority === 'high' ? "default" : "outline"}
            onClick={() => setPriority(priority === 'high' ? '' : 'high')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {priority === 'high' ? "Showing High Priority Bugs" : "Show High Priority Bugs"}
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
          {!loading && totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </div>
      </div>

      {/* Pagination - Top */}
      {data.length > 0 && (
        <div className='flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg'>
          <div className='flex items-center gap-3'>
            <LucideArrowBigLeft 
              className={`h-6 w-6 cursor-pointer transition-colors ${
                currentPage === 1 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1)
                }
              }} 
            />
            <span className='text-sm font-medium min-w-[120px] text-center'>
              Page {currentPage} of {totalPages}
            </span>
            <LucideArrowBigRight 
              className={`h-6 w-6 cursor-pointer transition-colors ${
                currentPage === totalPages 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1)
                }
              }} 
            />
          </div>
          <span className='text-sm text-muted-foreground'>
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}
          </span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        key={data.length}  // Force re-render when data length changes
        columns={columns(handleViewBug, handleEditBug)}
        data={paginatedData}
      />

      {/* Pagination - Bottom */}
      {data.length > 0 && (
        <div className='flex items-center justify-center mt-4 p-3'>
          <div className='flex items-center gap-3'>
            <LucideArrowBigLeft 
              className={`h-6 w-6 cursor-pointer transition-colors ${
                currentPage === 1 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }} 
            />
            <span className='text-sm font-medium min-w-[120px] text-center'>
              Page {currentPage} of {totalPages}
            </span>
            <LucideArrowBigRight 
              className={`h-6 w-6 cursor-pointer transition-colors ${
                currentPage === totalPages 
                  ? 'text-muted-foreground/30 cursor-not-allowed' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddBugDialog
        open={addBugOpen}
        onOpenChange={setAddBugOpen}
        onSave={handleSave}
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