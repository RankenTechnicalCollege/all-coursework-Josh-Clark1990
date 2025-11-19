import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

console.log('Initializing Better Auth with URL:', process.env.BETTER_AUTH_URL);

// Create MongoDB client
const mongoUrl = process.env.DATABASE_URL;
const dbName = process.env.MONGO_DB_NAME || 'DemoApi';

const client = new MongoClient(mongoUrl);

await client.connect();
console.log('MongoDB connected successfully');

const db = client.db(dbName); 

export const auth = betterAuth({
  baseURL: 'http://localhost:5000',
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:5000",
  ],
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  token: {
    enabled: true,
  },
  advanced: {
    disableCSRFCheck: true,
    cookieOptions: {
      sameSite: "lax",
      secure: false,
      httpOnly: true,
      path: "/",
    },
  },
});

// Export the connected client for direct MongoDB queries
export const mongoClient = client;
export const mongoDb = db;

console.log('Better Auth initialized with database:', dbName);