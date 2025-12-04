import { useState, useEffect } from 'react';
import { UserCard, type User } from './ui/userCard';

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

  // Debug logging
  console.log('UsersPage - Received currentUser prop:', currentUser);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users', {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Map Better Auth user to our User type format for compatibility
  const mappedCurrentUser: User = {
    _id: currentUser.id,
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    role: currentUser.role || 'developer',
  };

  console.log('UsersPage - Mapped currentUser:', mappedCurrentUser);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Error: {error}</div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((user) => (
          <UserCard key={user.id} user={user} currentUser={mappedCurrentUser} />
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  );
}

export default UsersPage;