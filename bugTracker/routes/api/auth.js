import express from 'express';
import { auth, mongoClient } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema} from '../../validation/userSchema.js';

export const authRouter = express.Router();

// -----------------------------------------------------------------------------
// Register new user
// -----------------------------------------------------------------------------
authRouter.post('/sign-up/email', validate(registerSchema), async (req, res) => {
  const { email, password, confirmPassword, name, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Normalize role
    const rawRole = typeof role === 'string' ? role : (role && role.name) ? role.name : 'developer';
    const roleMap = {
      technicalManager: 'technical manager',
      businessAnalyst: 'business analyst',
      qualityAnalyst: 'quality analyst',
      productManager: 'product manager',
      developer: 'developer'
    };
    const roleName = roleMap[rawRole] || rawRole;

    // 1. Create user with Better Auth
    const result = await auth.api.signUpEmail({
      body: { 
        email, 
        password, 
        name,
        role: roleName 
      }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // 2. Update MongoDB with arrays
    const db = mongoClient.db(process.env.MONGO_DB_NAME || 'DemoApi');
    await db.collection('user').updateOne(
      { id: result.user.id },
      { 
        $set: {
          createdBugs: [],
          assignedBugs: []
        }
      }
    );

    // 3. Fetch the complete user
    const updatedUser = await db.collection('user').findOne({ id: result.user.id });

    res.status(201).json({
      message: 'User registered successfully',
      user: updatedUser,
      token: result.token
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(err.statusCode || 500).json({
      error: err.body?.message || 'Failed to register user',
      details: err.message
    });
  }
});

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------
authRouter.post('/sign-in/email', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await auth.api.signInEmail({ body: { email, password } });

    if (!result || !result.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch user from MongoDB to get role
    const db = mongoClient.db();
    const mongoUser = await db.collection('user').findOne({ id: result.user.id });

    const userPayload = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: mongoUser?.role || 'developer'
    };

    res.status(200).json({
      message: `Login successful. Welcome back ${result.user.name}!`,
      user: userPayload,
      token: result.token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(err.statusCode || 401).json({
      error: err.body?.message || 'Invalid email or password'
    });
  }
});

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------
authRouter.post('/sign-out', async (req, res) => {
  try {
    const token = req.cookies['better-auth.session_token'];
    
    if (token) {
      const db = mongoClient.db();
      await db.collection('session').deleteOne({ token }).catch(() => {});
    }

    res.clearCookie('better-auth.session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({ message: 'User signed out successfully' });
  } catch (error) {
    console.error('Sign-out error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

export default authRouter;