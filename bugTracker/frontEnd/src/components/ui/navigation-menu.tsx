import { Bug } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { ModeToggle } from '@/components/ui/modeToggle';
import { Button } from '@/components/ui/button';
import { authClient, useSession, type ExtendedUser } from '@/lib/betterAuth';
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { data: session} = useSession();
  const navigate = useNavigate();
  
  // Cast user to ExtendedUser to access role
  const user = session?.user as ExtendedUser | undefined;
  const userRole = user?.role;
  const canAccessUsers = userRole === 'technical manager' || userRole === 'admin';

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate('/');
  };

  return (
    <nav className="h-16 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        
        {/* Clickable logo - navigates to home */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Bug className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">BugTracker</span>
        </Link>
        
        <div className="flex items-center gap-6">

          <NavLink
            to='/?addBug=true'
            className={({ isActive }) => 
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Submit A Bug
          </NavLink>

          {/* Only show Users link if user has proper role */}
          {canAccessUsers && (
            <NavLink 
              to='/showUsers'
              className={({ isActive }) => 
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Users
            </NavLink>
          )}
          
          <div className="flex items-center gap-4">
            {/* User name as clickable link to profile */}
            {user?.name && (
              <NavLink 
                to="/profile"
                className={({ isActive }) => 
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {user.name}
              </NavLink>
            )}
            <ModeToggle />
            <Button variant='default' onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;