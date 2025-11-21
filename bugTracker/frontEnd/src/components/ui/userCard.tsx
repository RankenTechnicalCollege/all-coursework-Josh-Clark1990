import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { capitalizeWords } from '@/lib/capitalizeWords';
import { EditUserDialog } from '../editUserDialog';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedBugs?: string[];
}

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSave = () => {
    console.log('User Updated Successfully');
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
            <span className="font-medium">{user.id}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Assigned Bugs:</span>
            <span className="font-medium">{user.assignedBugs?.length || 0}</span>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              Edit User
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={user}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}