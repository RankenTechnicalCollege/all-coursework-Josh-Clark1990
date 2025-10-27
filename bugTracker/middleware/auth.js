import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
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
  advanced: {
    disableCSRFCheck: true,
  },
});