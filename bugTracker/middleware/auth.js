import dotenv from 'dotenv';
import { getDb } from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

export async function initAuth() {
  // Just ensure DB is connected
  const db = await getDb();
  console.log('✅ Auth initialized with database:', db.databaseName);
}

// Login with email and password
export async function loginWithEmail(email, password) {
  try {
    const db = await getDb();
    
    // Find user in Users collection
    const user = await db.collection('Users').findOne({ email });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.BETTER_AUTH_SECRET,
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        role: user.role
      },
      session: { token }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getAuth() {
  return {};
}

// Middleware to protect routes
export async function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.auth_token || req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue' });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET
    );

    // Get user from database
    const db = await getDb();
    const user = await db.collection('Users').findOne(
      { email: decoded.email },
      { projection: { password: 0 } } // Don't include password
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      role: user.role
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Invalid token, please log in again' });
  }
}