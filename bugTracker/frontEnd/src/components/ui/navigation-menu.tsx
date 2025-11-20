import { Bug } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { ModeToggle } from '@/components/ui/modeToggle';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/betterAuth';

const Navbar = () => {
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
            to='/users'
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Users
          </NavLink>
          
          <NavLink 
            to="/profile"
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-medium" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Profile
          </NavLink>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant='default' onClick={() => authClient.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;