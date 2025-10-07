import { useState} from 'react'
import { useEffect } from 'react'
import './App.css'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome back</h2>
          <h1 className="read-the-docs">Issue Tracker Login</h1>
        </div>
        <div className="login-body">
          <form>
            <div className="form-row">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>

            <div className="form-row">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" />
            </div>

            <div className="form-row">
              <Checkbox id="remember" /> <Label htmlFor="remember">Remember me</Label>
            </div>

            <div className="form-actions">
              <Button className="btn" type="button">Sign In</Button>
              <a className="secondary-link" href="#">Forgot password?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function App() {
// let data;
// const [users, setUsers] = useState([]); 
// useEffect(() => {

//   const fetchUsers = async () => {
//     const apiResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
//     console.log("API Response:", apiResponse.data);
//     data = apiResponse.data;
//     setUsers(data);
//   }
//     const data = import.meta.VITE_API_URL;
//     console.log("API URL:", data);
//   }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full">
        <LoginForm />
      </div>
    </div>
  );
}

export default App
