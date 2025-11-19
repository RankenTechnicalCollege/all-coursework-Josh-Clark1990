import express from 'express';
import { auth, mongoClient } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema} from '../../validation/userSchema.js';
export const authRouter = express.Router();
import { ObjectId } from 'mongodb';

// -----------------------------------------------------------------------------
// Register new user
// -----------------------------------------------------------------------------
authRouter.post('/sign-up/email', validate(registerSchema), async (req, res) => {
  const { email, password, confirmPassword, fullName, givenName, familyName, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // 1. Create user with Better Auth
    const result = await auth.api.signUpEmail({
      body: { email, password, name: fullName }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

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

    // 2. Update user in MongoDB with additional fields
    const db = mongoClient.db(process.env.MONGO_DB_NAME || 'DemoApi');
    const updateResult = await db.collection('user').updateOne(
      { _id: new ObjectId(result.user.id) },
      { 
        $set: {
          givenName,
          familyName,
          role: roleName,
          createdBugs: [],
          assignedBugs: []
        }
      }
    );

    console.log('Update result - matched:', updateResult.matchedCount, 'modified:', updateResult.modifiedCount);

    // 3. Fetch the updated user with _id
    const updatedUser = await db.collection('user').findOne({ 
      _id: new ObjectId(result.user.id) // ✅ Use _id, not id
    });

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

    console.log('Login result token:', result.token);
    console.log('Login result user:', result.user.id);

    // Fetch user from MongoDB to get role
    const db = mongoClient.db();
    const mongoUser = await db.collection('user').findOne({ id: result.user.id });

    const userPayload = {
      id: result.user.id,
      email: result.user.email,
      givenName: mongoUser?.givenName,
      familyName: mongoUser?.familyName,
      userRoles: mongoUser?.role ? [mongoUser.role] : ['developer']
    };

    // Check session in MongoDB
    const dbSession = await db.collection('session').findOne({ token: result.token });
    console.log('Session created in DB:', dbSession ? 'Yes' : 'No');
    if (dbSession) {
      console.log('Session expires at:', dbSession.expiresAt);
      console.log('Session user ID:', dbSession.userId);
    }

    res.status(200).json({
      message: `Login successful. Welcome back ${userPayload.givenName || result.user.name}!`,
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
      // Delete session from MongoDB
      const db = mongoClient.db();
      await db.collection('session').deleteOne({ token }).catch(() => {
        // Session might already be deleted
      });
    }

    res.clearCookie('better-auth.session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    console.log('Cookies cleared:', res.getHeaders());

    res.status(200).json({ message: 'User signed out successfully' });
  } catch (error) {
    console.error('Sign-out error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

export default authRouter;