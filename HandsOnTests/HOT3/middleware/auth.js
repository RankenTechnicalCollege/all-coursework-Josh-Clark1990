import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "../database.js";

export const auth = betterAuth({
  baseURL: 'http://localhost:2023',
  trustedOrigins: [
    'http://localhost:2023',
    'http://localhost:3000'
  ],
  database: mongodbAdapter(await getDb()),
  
  // Add custom user fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "admin",
        required: false,
      }
    }
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  session: {
    cookieCache: true,
    maxAge: 60 * 60 * 1000, //1 hour
  },
  token: {
    enabled: true,
  },
  advanced: {
    disableCSRFCheck: true,
  }, 
});