import { useState, useEffect } from 'react';
import { UserCard, type User } from './ui/userCard'; 
import { Button } from './ui/button';
import { EditUserDialog } from './editUserDialog';

export function UserProfilePage() { 
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users/me', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const result = await response.json();
      setUser(result);
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading profile...</div>
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">User profile not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your profile information
        </p>
      </div>

      <div className="max-w-md">
        <UserCard user={user} currentUser={user} />
      </div>

      <Button className="mt-6" onClick={() => setEditDialogOpen(true)}>Edit Profile</Button>

      <EditUserDialog 
        user={user}
        currentUser={user}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={fetchUser}
      />

    </div>

  );
}

export default UserProfilePage;