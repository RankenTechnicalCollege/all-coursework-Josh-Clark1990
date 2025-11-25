import express from 'express';
import { ObjectId } from 'mongodb';
import { mongoClient, auth } from '../../middleware/auth.js';
import { getDb } from '../../database.js';
import debug from 'debug';
import { userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { validate } from '../../middleware/validator.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { hasPermissions } from '../../middleware/hasPermissions.js';
import { hasRole } from '../../middleware/hasRole.js';
import { hasAnyRole } from '../../middleware/hasAnyRole.js';

// Debug namespaces
const debugGet = debug('users:get');
const debugUpdate = debug('users:update');
const debugDelete = debug('users:delete');

const router = express.Router();

// -----------------------------------------------------------------------------
// Get all users with filtering, sorting, and pagination
// -----------------------------------------------------------------------------
router.get(
  '/',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  async (req, res) => {
    try {
      debugGet('Fetching all users');
      const db = mongoClient.db();

      const { keywords, role, minAge, maxAge, page, limit, sortBy, order } = req.query;

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 0;
      const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

      // Build filter
      const filter = {};
      
      if (keywords) {
        filter.$or = [
          { email: { $regex: keywords, $options: 'i' } },
          { givenName: { $regex: keywords, $options: 'i' } },
          { familyName: { $regex: keywords, $options: 'i' } },
          { name: { $regex: keywords, $options: 'i' } }
        ];
      }

      if (role) {
        filter.role = role;
      }

      if (minAge || maxAge) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateFilter = {};
        if (maxAge) {
          dateFilter.$gte = new Date(today.getTime() - maxAge * 24 * 60 * 60 * 1000);
        }
        if (minAge) {
          dateFilter.$lte = new Date(today.getTime() - minAge * 24 * 60 * 60 * 1000);
        }

        filter.createdAt = dateFilter;
      }

      // Sorting
      const sortDirection = order === 'desc' ? -1 : 1;
      const sort = sortBy ? { [sortBy]: sortDirection } : { role: 1 };

      // Projection
      const projection = {
        _id: 1,
        email: 1,
        familyName: 1,
        givenName: 1,
        name: 1,
        createdBugs: 1,
        assignedBugs: 1,
        role: 1,
        createdAt: 1
      };

      const users = await db.collection('user')
        .find(filter)
        .project(projection)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'No users found' });
      }

      debugGet(`Found ${users.length} users`);
      res.status(200).json(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Get current user's profile
// -----------------------------------------------------------------------------
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const db = mongoClient.db();
    const userId = req.user.id;
    debugGet('Fetching current user profile');

    const user = await db.collection('user').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          _id: 1,
          email: 1,
          familyName: 1,
          givenName: 1,
          name: 1,
          createdBugs: 1,
          assignedBugs: 1,
          role: 1,
          createdAt: 1
        }
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Get user by ID
// -----------------------------------------------------------------------------
router.get(
  '/:id',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(userIdSchema, 'params'),
  async (req, res) => {
    try {
      const db = mongoClient.db();
      const userId = req.params.id;
      debugGet(`Fetching user with ID: ${userId}`);

      const user = await db.collection('user').findOne(
        { _id: new ObjectId(userId) },
        {
          projection: {
            _id: 1,
            email: 1,
            familyName: 1,
            givenName: 1,
            name: 1,
            createdBugs: 1,
            assignedBugs: 1,
            role: 1,
            createdAt: 1
          }
        }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Update current user's profile
// -----------------------------------------------------------------------------
router.patch(
  '/me',
  isAuthenticated,
  validate(userUpdateSchema, 'body'),
  async (req, res) => {
    try {
      const db = mongoClient.db();
      const userId = req.user.id;
      const updates = { ...req.body, updatedAt: new Date() };
      debugUpdate(`User ${userId} updating their info`);

      // Prevent role changes in /me route
      if ('role' in updates) {
        return res.status(403).json({
          error: 'Role changes are not allowed. Please contact a technical manager.'
        });
      }

      // Handle password updates through Better Auth
      if (updates.password) {
        try {
          await auth.api.changePassword({
            body: {
              newPassword: updates.password,
              currentPassword: updates.currentPassword
            },
            headers: req.headers
          });
          debugUpdate('Password successfully updated');
        } catch (err) {
          return res.status(400).json({ error: 'Failed to update password' });
        }
        delete updates.password;
        delete updates.confirmPassword;
        delete updates.currentPassword;
      }

      // Update custom fields
      if (Object.keys(updates).length > 1) {
        await db.collection('user').updateOne(
          { _id: new ObjectId(userId) },
          { $set: updates }
        );

        // Log edit
        try {
          const editsDb = await getDb();
          await editsDb.collection('edits').insertOne({
            timestamp: new Date(),
            col: 'user',
            op: 'update',
            target: { userId },
            update: updates,
            auth: req.user
          });
        } catch (editErr) {
          console.error('Failed to log edit:', editErr);
        }
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        updatedAt: updates.updatedAt
      });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Update user by ID (technical manager only)
// -----------------------------------------------------------------------------
router.patch(
  '/:id',
  isAuthenticated,
  hasPermissions('canEditAnyUser'),
  hasRole('technical manager'),
  validate(userUpdateSchema, 'body'),
  validate(userIdSchema, 'params'),
  async (req, res) => {
    try {
      const db = mongoClient.db();
      const userId = req.params.id;
      const updates = { ...req.body, updatedAt: new Date() };
      debugUpdate(`Updating user ${userId}`);

      // Don't allow password updates through this endpoint
      delete updates.password;
      delete updates.confirmPassword;
      delete updates.currentPassword;

      const result = await db.collection('user').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log edit
      try {
        const editsDb = await getDb();
        await editsDb.collection('edits').insertOne({
          timestamp: new Date(),
          col: 'user',
          op: 'update',
          target: { userId },
          update: updates,
          auth: req.user
        });
      } catch (editErr) {
        console.error('Failed to log edit:', editErr);
      }

      res.status(200).json({
        message: 'User updated successfully',
        updatedAt: updates.updatedAt
      });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// -----------------------------------------------------------------------------
// Delete user by ID (technical manager only)
// -----------------------------------------------------------------------------
router.delete(
  '/:id',
  isAuthenticated,
  hasPermissions('canEditAnyUser'),
  hasRole('technical manager'),
  validate(userIdSchema, 'params'),
  async (req, res) => {
    try {
      const db = mongoClient.db();
      const userId = req.params.id;
      debugDelete(`Deleting user: ${userId}`);

      const result = await db.collection('user').deleteOne(
        { _id: new ObjectId(userId) }
      );

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        message: 'User deleted successfully',
        deletedId: userId
      });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export { router as usersRouter };