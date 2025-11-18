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
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import { authClient } from '@/lib/betterAuth'

export function LoginForm({
  className,
  onSwitchToSignup,
  ...props
}: React.ComponentProps<"div"> & { onSwitchToSignup?: () => void}) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  
  await authClient.signIn.email(
    { email, password },
    {
      onSuccess: () => {
        console.log('Login successful!')
        setError(null)
        window.location.href = '/'
      },
      onError: (ctx) => {
        console.log('Login failed:', ctx.error)
        setError('Invalid email or password')
      }
    }
  )
}

  return (
    <div className={cn("flex flex-col gap-6 bg-card text-card-foreground border rounded-lg shadow-lg p-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  
                  <div className="flex flex-col items-end ml-auto text-sm space-y-2">
                    <a href="#" className="hover:underline">
                      Forgot your password?
                    </a>
                  </div>

                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button">
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don't have an account?{''} 
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    onSwitchToSignup?.();
                  }}>
                    Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}