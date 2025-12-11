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

      // Frontend sends 'name' instead of 'keywords', so support both
      const { name, keywords, role, hasBugs, page, limit, sortBy, order } = req.query;
      const searchTerm = name || keywords; // Support both parameters

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 0;
      const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

      // Build filter
      const filter = {};
      
      // Search by name or email
      if (searchTerm) {
        filter.$or = [
          { email: { $regex: searchTerm, $options: 'i' } },
          { givenName: { $regex: searchTerm, $options: 'i' } },
          { familyName: { $regex: searchTerm, $options: 'i' } },
          { name: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // Filter by role
      if (role) {
        filter.role = role;
      }

      // Filter by whether user has assigned bugs
      if (hasBugs) {
        if (hasBugs === 'true') {
          filter.assignedBugs = { $exists: true, $ne: [], $not: { $size: 0 } };
        } else if (hasBugs === 'false') {
          filter.$or = [
            { assignedBugs: { $exists: false } },
            { assignedBugs: [] },
            { assignedBugs: { $size: 0 } }
          ];
        }
      }

      // Sorting
      const sortDirection = order === 'desc' ? -1 : 1;
      let sort = { role: 1, name: 1 }; 
      
      if (sortBy) {
        
        const sortMapping = {
          'name': 'name',
          'role': 'role',
          'createdAt': 'createdAt',
          'email': 'email'
        };
        
        const sortField = sortMapping[sortBy] || 'name';
        sort = { [sortField]: sortDirection, name: 1 }; 
      }

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

      // Return empty array instead of 404 when no users found (better UX)
      if (!users || users.length === 0) {
        return res.status(200).json({ users: [] });
      }

      debugGet(`Found ${users.length} users`);
      
      // Wrap in object to match frontend expectation
      res.status(200).json({ users });
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
// Get all users eligible to be assigned bugs (only developers and QA)
// -----------------------------------------------------------------------------
router.get('/assignable-users', isAuthenticated, async (req, res) => {
  try {
    const db = mongoClient.db();
    const users = await db.collection('user')
      .find({
        role: { 
          $in: ['developer', 'quality analyst'] 
        }
      })
      .project({ 
        _id: 1, 
        name: 1, 
        email: 1, 
        role: 1 
      })
      .toArray();

    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching assignable users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
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
          // Use Better Auth's handler directly
          const passwordChangeResult = await auth.api.changePassword({
            body: {
              newPassword: updates.password,
              currentPassword: updates.currentPassword,
            },
            headers: req.headers,
            asResponse: false,
          });
          
          debugUpdate('Password successfully updated');
        } catch (err) {
          console.error('Password change error:', err);
          return res.status(400).json({ 
            error: err.message || 'Failed to update password. Please check your current password.' 
          });
        }
        // Remove password fields from updates
        delete updates.password;
        delete updates.currentPassword;
      }

      // Update custom fields (name, email, etc.)
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