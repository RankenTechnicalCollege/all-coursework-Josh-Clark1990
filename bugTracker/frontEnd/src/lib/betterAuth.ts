import { createAuthClient } from "better-auth/react"

export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedBugs?: string[]; 
}

export const authClient = createAuthClient({
  baseURL:"http://localhost:5000/api/auth",
  credentials:"include",
});

export const { useSession } = authClient;