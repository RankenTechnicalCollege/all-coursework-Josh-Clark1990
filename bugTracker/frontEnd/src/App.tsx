import { LoginForm } from '@/components/login-form';
import './App.css'
import { authClient } from '@/lib/betterAuth';
import { Button } from '@/components/ui/button';
import { SignupForm } from './components/signup-form';
import { useState } from 'react';
import { ThemeProvider } from '@/components/ui/themeProvider';
import { ModeToggle } from '@/components/ui/modeToggle';
import BugDisplay from './components/bugDisplay';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppContent />
    </ThemeProvider>
  )
}

function AppContent() {
  const { data: session, isPending } = authClient.useSession();
  const [showSignup, setShowSignup] = useState(false);

  console.log('App render - isPending:', isPending);
  console.log('App render - session:', session);

  if (isPending) {
    return <div>Loading...</div>
  }

  if(!session) {
    return (
      <div className="min-h-screen bg-background">
        {/* Theme toggle for login/signup pages */}
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
      {/* Theme toggle for authenticated pages */}
      <header className="border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bug Tracker</h1>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant='default' onClick={() => authClient.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <h2>Welcome, {session.user.name}</h2>
        {/* Your app content here */}
        <BugDisplay />
      </main>
    </div>
  )
}

export default App