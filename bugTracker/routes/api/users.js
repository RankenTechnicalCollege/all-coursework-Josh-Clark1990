import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { validate } from '../../middleware/validator.js';
import { auth } from '../../middleware/auth.js';
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
// Get all users
// -----------------------------------------------------------------------------
router.get('/', isAuthenticated, hasPermissions('canViewData'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), async (req, res) => {
  try {
    console.log('Fetching all users');
    const db = await getDb();

    const { keywords, role, minAge, maxAge, page, limit, sortBy, order } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 0;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const filter = {};
    if (keywords) filter.$text = { $search: keywords };
    if (role) filter.role = role;

    if (minAge || maxAge) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateFilter = {};
      if (maxAge) dateFilter.$gte = new Date(today.getTime() - maxAge * 24 * 60 * 60 * 1000);
      if (minAge) dateFilter.$lte = new Date(today.getTime() - minAge * 24 * 60 * 60 * 1000);

      filter.createdAt = dateFilter;
    }

    const sortDirection = order === 'desc' ? -1 : 1;
    const sort = sortBy ? { [sortBy]: sortDirection } : { role: 1 };

    const users = await db.collection('User')
      .find(filter, {
        projection: {
          email: 1,
          familyName: 1,
          givenName: 1,
          createdBugs: 1,
          assignedBugs: 1,
          role: 1
        },
        sort
      })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    if (!users || users.length === 0) {
      console.log('No users found');
      return res.status(404).json({ error: 'No users found' });
    }

    console.log(`Found ${users.length} users`);
    res.status(200).json(users);
  } catch (err) {
    console.error('🔥 FULL ERROR:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Find user by ID
// -----------------------------------------------------------------------------
router.get('/:id', isAuthenticated, hasPermissions('canViewData'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(userIdSchema, 'params'), async (req, res) => {
    console.log('req.params:', req.params);
    console.log('req.body:', req.body);
    console.log('req.query:', req.query);

    try {
        const db = await getDb();
        const userId = req.params.id;

        debugGet(`Fetching user with ID: ${userId}`);

        // Better Auth uses string IDs, not ObjectIds
        const user = await db.collection('User').findOne(  // Changed to 'User'
            { id: userId },
            {
                projection: {
                    email: 1,
                    familyName: 1,
                    givenName: 1,
                    createdBugs: 1,
                    assignedBugs: 1,
                    role: 1
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
});

// -----------------------------------------------------------------------------
// User updates their own info
// -----------------------------------------------------------------------------
router.patch('/me', isAuthenticated, validate(userUpdateSchema, 'body'), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id; 
        const updates = req.body || {};
        
        // Explicitly prevent role changes in the /me route
        if ('role' in updates) {
            return res.status(403).json({ 
                error: 'Role changes are not allowed in this route. Please contact a technical manager.'
            });
        }
        
        updates.lastUpdated = new Date();

        debugUpdate(`User ${userId} updating their info with: ${JSON.stringify(updates)}`);

        // If password is being updated, use Better Auth
        if (updates.password) {
            await auth.api.changePassword({
                body: {
                    newPassword: updates.password,
                    currentPassword: updates.currentPassword // You'll need to require this
                },
                headers: req.headers
            });
            debugUpdate('Password successfully updated via Better Auth');
            delete updates.password;
            delete updates.confirmPassword;
            delete updates.currentPassword;
        }

        // Update custom fields
        if (Object.keys(updates).length > 1) { // More than just lastUpdated
            await db.collection('User').updateOne(  // Changed to 'User'
                { id: userId },
                { $set: updates }
            );

            await db.collection('edits').insertOne({
                timestamp: new Date(),
                col: 'User',  // Changed to 'User'
                op: 'update',
                target: { userId: userId },
                update: updates,
                auth: req.user
            });
        }

        res.status(200).json({ 
            message: 'Your info has been successfully updated', 
            lastUpdated: updates.lastUpdated 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------------------------------------------------------------
// Update user by ID (technical manager)
// -----------------------------------------------------------------------------
router.patch('/:id', isAuthenticated, hasPermissions('canEditAnyUser'), hasRole('technical manager'), validate(userUpdateSchema, 'body'), validate(userIdSchema, 'params'), async (req, res) => {  // Changed to 'technical manager'
    try {
        const db = await getDb();
        const userId = req.params.id;
        const updates = req.body || {};
        updates.lastUpdated = new Date();

        debugUpdate(`Updating user ${userId} with: ${JSON.stringify(updates)}`);

        // Don't allow password updates through this endpoint for security
        if (updates.password) {
            delete updates.password;
            delete updates.confirmPassword;
        }

        const result = await db.collection('User').updateOne(  // Changed to 'User'
            { id: userId }, 
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            message: 'User updated successfully',
            lastUpdated: updates.lastUpdated
        });
    } catch (err) {
        console.error('Update user error:', err);
        return res.status(400).json({ error: 'Invalid input' });
    }
});

// -----------------------------------------------------------------------------
// Delete user by ID
// -----------------------------------------------------------------------------
router.delete('/:id', isAuthenticated, hasPermissions('canEditAnyUser'), hasRole('technical manager'), validate(userIdSchema, 'params'), async (req, res) => {  // Changed to 'technical manager' and fixed validate
    try {
        const db = await getDb();
        const userId = req.params.id;

        debugDelete(`Attempting to delete user: ${userId}`);

        const result = await db.collection('User').deleteOne({ id: userId });  // Changed to 'User'

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            message: 'User deleted successfully',
            deletedId: userId
        });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(400).json({ error: 'Invalid input' });
    }
});

export { router as usersRouter };