import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { capitalizeWords } from '@/lib/capitalizeWords';
import { EditUserDialog } from '../editUserDialog';
import { AssignedBugsDialog } from '@/components/assignedBugsDialog';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  assignedBugs?: string[];
}

interface UserCardProps {
  user: User;
  currentUser: User | null;
}

export function UserCard({ user, currentUser }: UserCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assignedBugsDialogOpen, setAssignedBugsDialogOpen] = useState(false);
  const [selectedUserForBugs, setSelectedUserForBugs] = useState<User | null>(null);

  // Check if current user is a technical manager
  const canEditUsers = currentUser?.role === 'technical manager';

  // Debug logging
  console.log('UserCard - Received currentUser:', currentUser);
  console.log('UserCard - User being displayed:', user);
  console.log('UserCard - Can edit users:', canEditUsers);

  const handleSave = () => {
    console.log('User Updated Successfully');
  };

  const onViewAssignedBugs = (user: User) => {
    setSelectedUserForBugs(user);
    setAssignedBugsDialogOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <Badge variant="secondary" className="mt-1">
              {capitalizeWords(user.role)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>User ID:</span>
            <span className="font-medium">{user._id}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Assigned Bugs:</span>
            <button
              onClick={() => onViewAssignedBugs(user)}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {user.assignedBugs?.length || 0}
            </button>
          </div>
          
          {/* Only show Edit button for technical managers */}
          {canEditUsers && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                Edit User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only render edit dialog for technical managers */}
      {canEditUsers && (
        <EditUserDialog
          user={user}
          currentUser={currentUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSave}
        />
      )}

      <AssignedBugsDialog
        user={selectedUserForBugs}
        open={assignedBugsDialogOpen}
        onOpenChange={setAssignedBugsDialogOpen}
        onViewBugDetails={() => {
          setAssignedBugsDialogOpen(false);
        }}
      />
    </>
  );
}