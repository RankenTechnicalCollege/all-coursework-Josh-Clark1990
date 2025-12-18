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
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

export const { useSession } = authClient;