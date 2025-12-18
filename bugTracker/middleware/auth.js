import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const mongoUrl = process.env.DATABASE_URL;
const dbName = process.env.MONGO_DB_NAME || 'DemoApi';

const client = new MongoClient(mongoUrl);

await client.connect();

const db = client.db(dbName); 

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:8080", 
    "http://localhost:5000",
    "https://bugtracker-1019735204077.us-central1.run.app",
    process.env.BETTER_AUTH_URL,
  ],
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
      },
      assignedBugs: {
        type: "string[]",
        required: false,
        defaultValue: [],
      },
      createdBugs: {
        type: "string[]",
        required: false,
        defaultValue: [],
      },
    }
  },
  session: {
    fetchUser: true,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60
    },
  },
  token: {
    enabled: true,
  },
  advanced: {
    disableCSRFCheck: true,
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: "/",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  },
});

export const mongoClient = client;
export const mongoDb = db;