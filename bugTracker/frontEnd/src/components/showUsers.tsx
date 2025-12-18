import { useState, useEffect } from 'react';
import { UserCard, type User } from './ui/userCard';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, RefreshCw } from 'lucide-react'
import { API_URL } from '@/config'

interface UsersPageProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role?: string;
    _id?: string;
  };
}

export function UsersPage({ currentUser }: UsersPageProps) {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchName, setSearchName] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [hasBugsFilter, setHasBugsFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('')

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams()
      
      if (searchName) params.append('name', searchName)
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter)
      if (hasBugsFilter && hasBugsFilter !== 'all') params.append('hasBugs', hasBugsFilter)
      if (sortBy && sortBy !== 'all') params.append('sortBy', sortBy)
      if (sortOrder && sortOrder !== 'all') params.append('order', sortOrder)

      const response = await fetch(`${API_URL}/api/users?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.users || result || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchUsers();
  }, [searchName, roleFilter, hasBugsFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchName('')
    setRoleFilter('')
    setHasBugsFilter('')
    setSortBy('')
    setSortOrder('')
  }

  const hasActiveFilters = searchName || 
                      (roleFilter && roleFilter !== '') || 
                      (hasBugsFilter && hasBugsFilter !== '') || 
                      (sortBy && sortBy !== '') ||
                      (sortOrder && sortOrder !== '')

  // Map Better Auth user to our User type format for compatibility
  const mappedCurrentUser: User = {
    _id: currentUser.id,
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    role: currentUser.role || 'developer',
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
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
              fetchUsers()
            }}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage and view all users in the system
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10"
            />
          </div>

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
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="developer">Developer</SelectItem>
              <SelectItem value="business analyst">Business Analyst</SelectItem>
              <SelectItem value="quality analyst">Quality Analyst</SelectItem>
              <SelectItem value="product manager">Product Manager</SelectItem>
              <SelectItem value="technical manager">Technical Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          {/* Has Bugs Filter */}
          <Select value={hasBugsFilter} onValueChange={setHasBugsFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by assignments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Has Assigned Bugs</SelectItem>
              <SelectItem value="false">No Assigned Bugs</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="createdAt">Join Date</SelectItem>
              <SelectItem value="email">Email</SelectItem>
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
          {loading ? 'Loading...' : `Found ${data.length} user${data.length !== 1 ? 's' : ''}`}
        </div>
      </div>
      
      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((user) => (
          <UserCard key={user.id} user={user} currentUser={mappedCurrentUser} />
        ))}
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No users found matching your filters
        </div>
      )}
    </div>
  );
}

export default UsersPage;