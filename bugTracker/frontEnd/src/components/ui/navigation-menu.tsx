import { Bug, Menu, X } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { ModeToggle } from '@/components/ui/modeToggle';
import { Button } from '@/components/ui/button';
import { authClient, useSession, type ExtendedUser } from '@/lib/betterAuth';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Cast user to ExtendedUser to access role
  const user = session?.user as ExtendedUser | undefined;

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Close menu when clicking a link
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Close menu on window resize above mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <nav className="h-16 border-b border-border bg-card shadow-sm relative z-50">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        
        {/* Clickable logo - navigates to home */}
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={closeMenu}
        >
          <Bug className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">BugTracker</span>
        </Link>

        {/* Hamburger Menu Button - Only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
        
        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
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

          {/* Show Users link to all authenticated users */}
          {user && (
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

      {/* Mobile Menu - Slides in from right */}
      <div
        className={`
          fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 
          bg-background border-l border-border
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          shadow-xl z-50
        `}
      >
        <div className="flex flex-col p-6 gap-6">
          <NavLink
            to='/?addBug=true'
            onClick={closeMenu}
            className={({ isActive }) => 
              isActive
                ? "text-primary font-medium text-lg"
                : "text-foreground hover:text-primary transition-colors text-lg"
            }
          >
            Submit A Bug
          </NavLink>

          {user && (
            <NavLink 
              to='/showUsers'
              onClick={closeMenu}
              className={({ isActive }) => 
                isActive 
                  ? "text-primary font-medium text-lg" 
                  : "text-foreground hover:text-primary transition-colors text-lg"
              }
            >
              Users
            </NavLink>
          )}

          {user?.name && (
            <NavLink 
              to="/profile"
              onClick={closeMenu}
              className={({ isActive }) => 
                isActive 
                  ? "text-primary font-medium text-lg" 
                  : "text-foreground hover:text-primary transition-colors text-lg"
              }
            >
              {user.name}
            </NavLink>
          )}

          <div className="pt-4 border-t border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Theme</span>
              <ModeToggle />
            </div>
            <Button 
              variant='default' 
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay - Only visible when mobile menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/50 md:hidden z-40"
          onClick={closeMenu}
        />
      )}
    </nav>
  );
};

export default Navbar;