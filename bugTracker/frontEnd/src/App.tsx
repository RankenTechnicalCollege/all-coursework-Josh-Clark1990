import { LoginForm } from '@/components/login-form';
import './App.css'
import { authClient } from '@/lib/betterAuth';
import { SignupForm } from './components/signup-form';
import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@/components/ui/themeProvider';
import { ModeToggle } from '@/components/ui/modeToggle';
import BugDisplay from './components/bugDisplay';
import Navbar from '@/components/ui/navigation-menu';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import { UsersPage } from '@/components/showUsers';
import { ProtectedRoute } from '@/components/protectedRoute';
import UserProfilePage from '@/components/userProfile';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from '@/config';

interface Bug {
  priority: string;
  [key: string]: unknown;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AppContent />
          <ToastContainer position="bottom-right" aria-label="Notifications" />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { data: session, isPending } = authClient.useSession();
  const [showSignup, setShowSignup] = useState(false);
  const hasCheckedHighPriorityBugsRef = useRef(false);

  // Check for high priority bugs on login
  useEffect(() => {
    if (session && !hasCheckedHighPriorityBugsRef.current) {
      const checkHighPriorityBugs = async () => {
        try {
          const response = await fetch(`${API_URL}/api/bugs?assignedToMe=true`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            const highPriorityBugs = data.bugs?.filter((bug: Bug) => bug.priority === 'high') || [];

            
            if (highPriorityBugs.length > 0) {
              toast.warning(
                `You have ${highPriorityBugs.length} high priority bug${highPriorityBugs.length > 1 ? 's' : ''} assigned to you!`,
                {
                  autoClose: 5000,
                }
              );
            }
          }
        } catch (error) {
          console.error('Error checking high priority bugs:', error);
        }
      };

      checkHighPriorityBugs();
      hasCheckedHighPriorityBugsRef.current = true;
    }
  }, [session]);

  console.log('App render - isPending:', isPending);
  console.log('App render - session:', session);

  if (isPending) {
    return <div>Loading...</div>
  }

  if(!session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className='w-full max-w-md'>
            {showSignup ? (
              <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
            ) : (
              <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto p-4">
        <Routes>
          {/* HOME PAGE */}
          <Route 
            path="/" 
            element={
              <>
                <h2>Welcome, {session.user.name}</h2>
                <BugDisplay />
              </>
            } 
          />

         {/* USERS PAGE - All authenticated users can view */}
        <Route 
          path="/showUsers" 
          element={
            <>
              {console.log('About to render UsersPage with session.user:', session.user)}
              <ProtectedRoute allowedRoles={['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']}>
                <UsersPage currentUser={session.user} />
              </ProtectedRoute>
            </>
          } 
        />
        <Route path="/profile" element={<UserProfilePage />} />
        </Routes>
      </main>

      {/* AddBugDialog is now handled inside BugDisplay component */}
    </div>
  )
}

export default App