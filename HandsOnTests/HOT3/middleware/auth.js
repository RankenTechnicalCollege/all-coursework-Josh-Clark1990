import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "@db";

export const auth = betterAuth({
baseURL: 'http://localhost:2023',
trustedOrigins: [
  'http://localhost:2023',
  'http:.//localhost:3000'
],
  database: mongodbAdapter(client),

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