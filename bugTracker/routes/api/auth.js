import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema, userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { PrismaClient } from '@prisma/client';
import debug from 'debug';

const prisma = new PrismaClient();

const debugCreate = debug('auth:create');
const debugLogin = debug('auth:login');
const debugGet = debug('auth:get');
const debugUpdate = debug('auth:update');
const debugDelete = debug('auth:delete');

export const authRouter = express.Router();

// -----------------------------------------------------------------------------
// Get all users
// -----------------------------------------------------------------------------
authRouter.get('/users', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching all users');
    const { keywords, role, page, limit, sortBy, order } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (role) where.role = role;
    if (keywords) {
      where.OR = [
        { email: { contains: keywords } },
        { givenName: { contains: keywords } },
        { familyName: { contains: keywords } }
      ];
    }

    const orderBy = sortBy ? { [sortBy]: order === 'desc' ? 'desc' : 'asc' } : { role: 'asc' };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        familyName: true,
        givenName: true,
        createdBugs: true,
        assignedBugs: true,
        role: true
      },
      orderBy,
      skip,
      take: limitNum
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Get user by ID
// -----------------------------------------------------------------------------
authRouter.get('/users/:id', isAuthenticated, validate(userIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.params.id;
    debugGet(`Fetching user with ID: ${userId}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        familyName: true,
        givenName: true,
        createdBugs: true,
        assignedBugs: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Register new user
// -----------------------------------------------------------------------------
authRouter.post('/sign-up/email', validate(registerSchema), async (req, res) => {
  const { email, password, confirmPassword, fullName, givenName, familyName, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    debugCreate('Attempting to create new user with Better Auth');

    // Create user with Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    debugCreate(`Better Auth created user with ID: ${result.user.id}`);

    // Update user with custom fields using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: result.user.id },
      data: {
        givenName,
        familyName,
        role: role || 'developer',
        createdBugs: [],
        assignedBugs: [],
      }
    });

    debugCreate(`Added custom fields to user ${result.user.id}`);

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
    debugLogin(`Login attempt for email: ${email}`);

    const result = await auth.api.signInEmail({
      body: { email, password }
    });

    if (!result || !result.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    debugLogin('Better Auth sign in successful');

    // Get full user data with custom fields
    const user = await prisma.user.findUnique({
      where: { id: result.user.id }
    });

    // Set the auth cookie
    res.cookie('better-auth.session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    debugLogin(`User ${result.user.id} logged in successfully`);

    res.status(200).json({
      message: `Login successful. Welcome back ${user?.givenName || user?.name}!`,
      user: user,
      token: result.token
    });
  } catch (err) {
    console.error('Login error:', err);
    debugLogin(`Login failed: ${err.message}`);
    res.status(err.statusCode || 401).json({
      error: err.body?.message || 'Invalid email or password'
    });
  }
});

// -----------------------------------------------------------------------------
// Get current user (me)
// -----------------------------------------------------------------------------
authRouter.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        givenName: true,
        familyName: true,
        role: true,
        createdBugs: true,
        assignedBugs: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Update current user
// -----------------------------------------------------------------------------
authRouter.patch('/me', isAuthenticated, validate(userUpdateSchema, 'body'), async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body || {};

    debugUpdate(`User ${userId} updating their info with: ${JSON.stringify(updates)}`);

    // If password is being updated, use Better Auth
    if (updates.password) {
      await auth.api.changePassword({
        body: {
          newPassword: updates.password,
          currentPassword: updates.currentPassword
        },
        headers: req.headers
      });
      debugUpdate('Password successfully updated via Better Auth');
      delete updates.password;
      delete updates.confirmPassword;
      delete updates.currentPassword;
    }

    // Update custom fields with Prisma
    if (Object.keys(updates).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates
      });

      res.status(200).json({
        message: 'Your info has been successfully updated',
        user: updatedUser
      });
    } else {
      res.status(200).json({
        message: 'Password updated successfully'
      });
    }
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Update user by ID (admin)
// -----------------------------------------------------------------------------
authRouter.patch('/users/:id', isAuthenticated, validate(userUpdateSchema, 'body'), validate(userIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body || {};

    debugUpdate(`Admin updating user ${userId} with: ${JSON.stringify(updates)}`);

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.confirmPassword;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Update user error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// -----------------------------------------------------------------------------
// Delete user by ID
// -----------------------------------------------------------------------------
authRouter.delete('/users/:id', isAuthenticated, validate(userIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.params.id;
    debugDelete(`Attempting to delete user: ${userId}`);

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({
      message: 'User deleted successfully',
      deletedId: userId
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Delete user error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

export default authRouter;