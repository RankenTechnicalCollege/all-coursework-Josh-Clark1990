import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
// import { authClient } from '@/lib/betterAuth'

export function SignupForm({
  className,
  onSwitchToLogin,
  ...props
}: React.ComponentProps<"div"> & { onSwitchToLogin?: () => void}) {
  const [givenName, setGivenName] = useState<string>('')
  const [familyName, setFamilyName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!role) {
      setError('Please select a role')
      return
    }

    // Combine given name and family name to create full name
    const fullName = `${givenName} ${familyName}`.trim()

    try {
      const response = await fetch('http://localhost:5000/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          fullName,      
          givenName,     
          familyName,    
          role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      setError(null)
      // Redirect or show success message
      console.log('Account created successfully!', data)
      
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred during signup')
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 text-sm text-red-600">
                {error}
              </div>
            )}
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="givenName">Given Name</FieldLabel>
                  <Input
                    id="givenName"
                    type="text"
                    placeholder="John"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="familyName">Family Name</FieldLabel>
                  <Input
                    id="familyName"
                    type="text"
                    placeholder="Doe"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FieldDescription>
                  We'll use this to contact you. We will not share your email with anyone else.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="business analyst">Business Analyst</SelectItem>
                    <SelectItem value="quality analyst">Quality Analyst</SelectItem>
                    <SelectItem value="product manager">Product Manager</SelectItem>
                    <SelectItem value="technical manager">Technical Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <FieldDescription>
                  Please confirm your password.
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" className="w-full">Create Account</Button>
                <Button variant="outline" type="button" className="w-full">
                  Sign up with Google
                </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin?.();
                    }}>
                      Sign in
                    </a>
                  </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}