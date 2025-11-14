import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Export prisma so other files can use it
export { prisma };

console.log('Initializing Better Auth with URL:', process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
  baseURL: 'http://localhost:5000',  // Use main server URL
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:5000",
    
  ],
  database: prismaAdapter(prisma, {
    provider: "mongodb",
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  session: {
    cookieCache: true,
    maxAge: 60 * 60 * 1000,
  },
  token:{
    enabled: true,
  },
  advanced: {
    disableCSRFCheck: true,
  },
});