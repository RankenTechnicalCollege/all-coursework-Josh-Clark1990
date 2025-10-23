import { MongoClient } from 'mongodb';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import dotenv from 'dotenv';

dotenv.config();

let auth;

export async function initAuth() {
  // Connect MongoDB client
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB');

  // Get the DB instance
  const db = client.db(process.env.MONGO_DB_NAME);
  console.log('MongoDB db object type:', db.constructor.name); // should print 'Db'

  // Initialize Better Auth
  auth = betterAuth({
    emailAndPassword: {
      enabled: true,
      secret: process.env.BETTER_AUTH_SECRET,
      tokenExpiresIn: 60 * 60 * 1000,
    },
    database: mongodbAdapter({ db }),
    jwt: { secret: process.env.BETTER_AUTH_SECRET },
  });

  console.log('✅ Better Auth initialized');
}

export function getAuth() {
  if (!auth) throw new Error('Auth not initialized. Call initAuth() first.');
  return auth;
}

// Middleware to protect routes
export async function isLoggedIn(req, res, next) {
  try {
    const user = await getAuth().getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: 'Please log in to continue' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token, please log in again' });
  }
}
