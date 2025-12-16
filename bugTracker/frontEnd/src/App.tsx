import { LoginForm } from '@/components/login-form';
import './App.css'
import { authClient } from '@/lib/betterAuth';
import { SignupForm } from './components/signup-form';
import { useState } from 'react';
import { ThemeProvider } from '@/components/ui/themeProvider';
import { ModeToggle } from '@/components/ui/modeToggle';
import BugDisplay from './components/bugDisplay';
import Navbar from '@/components/ui/navigation-menu';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { AddBugDialog } from '@/components/addBugDialog'; 
import { UsersPage } from '@/components/showUsers';
import { ProtectedRoute } from '@/components/protectedRoute';
import UserProfilePage from '@/components/userProfile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

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
  const [searchParams, setSearchParams] = useSearchParams();

  const isAddBugDialogOpen = searchParams.get('addBug') === 'true';
 
  const handleBugSave = () => {
    setSearchParams({});
  };

  const handleDialogClose = (open: boolean) => {
    if(!open) {
      setSearchParams({});
    }
  };

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

      {/* Add Bug Dialog */}
      <AddBugDialog
        open={isAddBugDialogOpen}
        onOpenChange={handleDialogClose} 
        onSave={handleBugSave}
      />
    </div>
  )
}

export default App