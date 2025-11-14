import { LoginForm } from '@/components/login-form';
import './App.css'
import { authClient } from '@/lib/betterAuth';
import { Button } from '@/components/ui/button';
import { SignupForm } from './components/signup-form';
import { useState } from 'react';

function App() {
  const { data: session, isPending } = authClient.useSession();
  const [showSignup, setShowSignup] = useState(false); // Toggle between login/signup

  // Add debugging
  console.log('App render - isPending:', isPending);
  console.log('App render - session:', session);

  if (isPending) {
    return <div>Loading...</div>
  }

  if(!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className='w-full max-w-md'>
          {showSignup ? (
            <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
          ) : (
            <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <Button variant='default' onClick={() => authClient.signOut()}>Sign Out</Button>
    </div>
  )
}

export default App