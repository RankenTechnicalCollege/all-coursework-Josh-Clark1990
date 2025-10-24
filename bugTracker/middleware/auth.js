import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getClient } from '../database.js';

const client = await getClient();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:8080",
    "https://bugtracker-1019735204077.us-central1.run.app"
  ],
  database: mongodbAdapter({
    client,
    dbName: process.env.MONGO_DB_NAME
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: true,
    maxAge: 60 * 60 * 1000, // 1 hour
  },
  user: {
    role: {
      type: "object",
      required: false,
    },
    profile: {
      type: "object",
      required: false,
    },
    createdAt: {
      type: "string",
      required: false,
    },
  },
});

