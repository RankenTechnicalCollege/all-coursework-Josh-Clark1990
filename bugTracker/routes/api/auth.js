import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema} from '../../validation/userSchema.js';
import { PrismaClient } from '@prisma/client';
import debug from 'debug';

const prisma = new PrismaClient();

const debugLogin = debug('auth:login');

export const authRouter = express.Router();


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

    console.log('Signup result token:', result.token);

    // Normalize role (accept either a string or an object like { name: 'technicalManager' })
    const rawRole = typeof role === 'string' ? role : (role && role.name) ? role.name : 'developer';
    // Map common camelCase or compact names to the spaced role names used in validation/role docs
    const roleMap = {
      technicalManager: 'technical manager',
      businessAnalyst: 'business analyst',
      qualityAnalyst: 'quality analyst',
      productManager: 'product manager',
      developer: 'developer'
    };

    const roleName = roleMap[rawRole] || rawRole;

    // 2. Upsert user in Prisma to ensure role exists
    const prismaUser = await prisma.user.upsert({
      where: { id: result.user.id },
      update: {
        givenName,
        familyName,
        role: roleName,
        createdBugs: [],
        assignedBugs: []
      },
      create: {
        id: result.user.id,
        email,
        givenName,
        familyName,
        role: roleName,
        createdBugs: [],
        assignedBugs: []
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: prismaUser,
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

    // Fetch Prisma user to get role
    const prismaUser = await prisma.user.findUnique({
      where: { id: result.user.id }
    });

    const userPayload = {
      id: result.user.id,
      email: result.user.email,
      givenName: prismaUser?.givenName,
      familyName: prismaUser?.familyName,
      userRoles: prismaUser?.role ? [prismaUser.role] : []
    };

    // Set auth cookie - Better Auth should handle this automatically
    // but we can ensure it's set correctly
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/'  // IMPORTANT: Add path
    };
    
    debugLogin('Setting cookie with token:', result.token.substring(0, 10) + '...');
    debugLogin('Cookie options:', cookieOptions);
    
    // Set the cookie
    res.cookie('better-auth.session_token', result.token, cookieOptions);

    // Debug: Verify session was created in database
    const dbSession = await prisma.session.findUnique({
      where: { token: result.token },
      include: { user: true }
    });
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
      // Delete session from database
      await prisma.session.delete({
        where: { token }
      }).catch(() => {
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