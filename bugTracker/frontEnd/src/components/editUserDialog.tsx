import { useState, useEffect } from 'react'
import { type User } from './ui/userCard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { API_URL } from '@/config'

interface EditUserDialogProps {
  user: User | null
  currentUser: User | null // The logged-in user
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const ROLES = [
  'developer',
  'technical manager',
  'product manager',
  'quality analyst',
  'business analyst',
  'user'
] as const

export function EditUserDialog({ user, currentUser, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if editing own account
  const isOwnAccount = currentUser && user && currentUser._id === user._id
  
  // Check if current user is technical manager
  const isTechnicalManager = currentUser?.role === 'technical manager'
  
  // Debug logging
  console.log('EditUserDialog - Current User:', currentUser)
  console.log('EditUserDialog - Current User Role:', currentUser?.role)
  console.log('EditUserDialog - Is Technical Manager:', isTechnicalManager)
  console.log('EditUserDialog - Is Own Account:', isOwnAccount)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setRole(user.role || '')
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate current password is provided when changing password
    if (password && !currentPassword) {
      setError('Current password is required to set a new password')
      return
    }

    try {
interface UpdateData {
  name?: string
  email?: string
  currentEmail?: string  // Made optional
  password?: string
  currentPassword?: string
  role?: string
}

const updateData: UpdateData = {}

// Determine the correct endpoint based on who is editing
let endpoint = ''

if (isOwnAccount) {
  // User editing their own profile - use /me endpoint
  endpoint = `${API_URL}/api/users/me`

  updateData.name = name
  updateData.email = email
  
  // Include password fields if user is changing password
  if (password) {
    updateData.password = password
    updateData.currentPassword = currentPassword
  }
  
  // Include currentEmail if email has changed
  if (email !== user.email) {
    updateData.currentEmail = user.email // Use user.email as the current email
  }
} else if (isTechnicalManager) {
  // Technical manager editing another user - use /:id endpoint
  endpoint = `${API_URL}/api/users/${user._id}`
  updateData.role = role
} else {
  // User trying to edit someone else without being a technical manager
  setError('You do not have permission to edit this user')
  return
}

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      setError(null)
      onSave()
      onOpenChange(false)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    }
  } 

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            User Name: {user.name}
            <br></br>
            User ID: {user._id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <FieldGroup>
          {/* Only show role field if current user is technical manager */}
            {isTechnicalManager && (
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Only show password fields if editing own account */}
            {isOwnAccount && (
              <>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user name"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email"
                required
              />
            </Field>

                <Field>
                  <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">New Password (optional)</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </Field>
              </>
            )}
          </FieldGroup>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}