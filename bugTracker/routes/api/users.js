import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { registerSchema, loginSchema, userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { validate } from '../../middleware/validator.js';
import { auth } from '../../middleware/auth.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

// Debug namespaces
const debugList = debug('users:list');
const debugGet = debug('users:get');
const debugCreate = debug('users:create');
const debugLogin = debug('users:login');
const debugUpdate = debug('users:update');
const debugDelete = debug('users:delete');

const router = express.Router();

// -----------------------------------------------------------------------------
// Get all users
// -----------------------------------------------------------------------------
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Fetching all users');
    const db = await getDb();
    const usersCollection = db.collection('user'); // Changed from 'Users' to 'user'

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

    const users = await usersCollection
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
router.get('/:id', isAuthenticated, validate(userIdSchema, 'params'), async (req, res) => {
    console.log('req.params:', req.params);
    console.log('req.body:', req.body);
    console.log('req.query:', req.query);

    try {
        const db = await getDb();
        const userId = req.params.id;

        debugGet(`Fetching user with ID: ${userId}`);

        // Better Auth uses string IDs, not ObjectIds
        const user = await db.collection('user').findOne(
            { id: userId }, // Changed from _id to id
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
// Create new user (Register) - Using Better Auth
// -----------------------------------------------------------------------------
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        debugCreate('Attempting to create new user with Better Auth');
        const { email, password, givenName, familyName, role } = req.body;

        // Check if user already exists
        const db = await getDb();
        const existingUser = await db.collection('user').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Use Better Auth to create the user
        const authUser = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: `${givenName} ${familyName}`,
            }
        });

        if (!authUser || !authUser.user) {
            return res.status(400).json({ error: 'Failed to create user' });
        }

        debugCreate(`Better Auth created user with ID: ${authUser.user.id}`);

        // Update the user with additional custom fields
        await db.collection('user').updateOne(
            { id: authUser.user.id },
            { 
                $set: {
                    givenName,
                    familyName,
                    role: role || 'developer',
                    createdBugs: [],
                    assignedBugs: [],
                    createdAt: new Date(),
                    lastUpdated: new Date()
                }
            }
        );

        debugCreate(`Added custom fields to user ${authUser.user.id}`);

        // Log the edit
        const editRecord = {
            timestamp: new Date(),
            col: "user",
            op: "insert",
            target: { userId: authUser.user.id },
            update: { email, givenName, familyName, role },
        };
        await db.collection("edits").insertOne(editRecord);
        debugCreate(`Edit log added for user ${authUser.user.id}`);

        res.status(201).json({
            message: 'New User registered!',
            userId: authUser.user.id
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(400).json({ 
            error: 'Invalid input', 
            details: err.message || err 
        });
    }
});

// -----------------------------------------------------------------------------
// Login - Using Better Auth
// -----------------------------------------------------------------------------
router.post('/login', validate(loginSchema, 'body'), async (req, res) => {
    try {
        const { email, password } = req.body;
        debugLogin(`Login attempt for email: ${email}`);

        // Use Better Auth to sign in
        const authResponse = await auth.api.signInEmail({
            body: { email, password }
        });

        debugLogin('Better Auth sign in successful');

        if (!authResponse || !authResponse.session) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set the auth cookie
        res.cookie('better-auth.session_token', authResponse.session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        // Fetch additional user info from your custom fields
        const db = await getDb();
        const user = await db.collection('user').findOne(
            { id: authResponse.user.id },
            { projection: { givenName: 1, familyName: 1, role: 1, createdBugs: 1, assignedBugs: 1 } }
        );

        debugLogin(`User ${authResponse.user.id} logged in successfully`);

        res.status(200).json({
            message: `Login successful. Welcome back ${user?.givenName || authResponse.user.name}!`,
            user: {
                ...authResponse.user,
                ...user
            },
        });

    } catch (err) {
        console.error('Login error:', err);
        debugLogin(`Login failed: ${err.message}`);
        res.status(401).json({
            error: 'Invalid email or password'
        });
    }
});

// -----------------------------------------------------------------------------
// User updates their own info
// -----------------------------------------------------------------------------
router.patch('/me', isAuthenticated, validate(userUpdateSchema, 'body'), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id; // Better Auth uses string IDs
        const updates = req.body || {};
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
            await db.collection('user').updateOne(
                { id: userId },
                { $set: updates }
            );

            await db.collection('edits').insertOne({
                timestamp: new Date(),
                col: 'user',
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
// Update user by ID (admin function)
// -----------------------------------------------------------------------------
router.patch('/:id', isAuthenticated, validate(userUpdateSchema, 'body'), validate(userIdSchema, 'params'), async (req, res) => {
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

        const result = await db.collection('user').updateOne(
            { id: userId }, // Changed from _id to id
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
router.delete('/:id', isAuthenticated, validate(userIdSchema), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;

        debugDelete(`Attempting to delete user: ${userId}`);

        const result = await db.collection('user').deleteOne({ id: userId }); // Changed from _id to id

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