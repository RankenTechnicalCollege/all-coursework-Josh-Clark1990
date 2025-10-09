import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { validate } from '../../middleware/validator.js';

// Salt rounds for bcrypt
const SALT_ROUNDS = 10;

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
router.get('/', async (req, res) => {
    try {
        debugList('Fetching all users');
        const db = await getDb();
        const usersCollection = db.collection('Users');

        const users = await usersCollection
            .find(
                {},
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
            )
            .toArray();

        if (!users || users.length === 0) {
            debugList('No users found');
            return res.status(404).json({ error: 'No users found' });
        }

        debugList(`Found ${users.length} users`);
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------------------------------------------------------------
// Find user by ID
// -----------------------------------------------------------------------------
router.get('/:id', validate(userIdSchema), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;

        debugGet(`Fetching user with ID: ${userId}`);

        if (!ObjectId.isValid(userId)) {
            debugGet(`Invalid user ID format: ${userId}`);
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const user = await db.collection('Users').findOne(
            { _id: new ObjectId(userId) },
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
// Create new user (Register)
// -----------------------------------------------------------------------------
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        debugCreate('Attempting to create new user');
        const db = await getDb();
        const newUser = req.body || {};

        debugCreate(`New user data: ${JSON.stringify(newUser)}`);

        const existingUser = await db.collection('Users').findOne({ email: newUser.email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(newUser.password, SALT_ROUNDS);
        debugCreate('Password hashed successfully');

        const userToInsert = {
            ...newUser,
            password: hashedPassword,
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        delete userToInsert.confirmPassword;

        const result = await db.collection('Users').insertOne(userToInsert);
        debugCreate(`User created with ID: ${result.insertedId}`);

        res.status(201).json({
            message: 'New User registered!',
            userId: result.insertedId
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(400).json({ error: 'Invalid input' });
    }
});

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        debugLogin('Login attempt');
        const db = await getDb();
        const { email, password } = req.body || {};

        debugLogin(`Login attempt for email: ${email}`);

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter your login credentials' });
        }

        const user = await db.collection('Users').findOne({ email });
        if (!user) {
            debugLogin('User not found');
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        debugLogin(`Password validation result: ${isValidPassword}`);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        debugLogin('Login successful');
        res.status(200).json({
            message: `Login successful. Welcome back ${user.givenName}`,
            userId: user._id,
            lastUpdated: user.lastUpdated || new Date()
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------------------------------------------------------------
// Update user by ID
// -----------------------------------------------------------------------------
router.patch('/:id', validate(userUpdateSchema, 'body'), validate(userIdSchema, 'params'), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;
        const updates = req.body || {};
        updates.lastUpdated = new Date();

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user id format' });
        }

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
            debugUpdate('Password hashed successfully');
            delete updates.confirmPassword;
        }

        debugUpdate(`Updating user ${userId} with: ${JSON.stringify(updates)}`);

        const result = await db.collection('Users').updateOne(
            { _id: new ObjectId(userId) },
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
router.delete('/:id', validate(userIdSchema), async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.params.id;

        debugDelete(`Attempting to delete user: ${userId}`);

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user id format' });
        }

        const result = await db.collection('Users').deleteOne({ _id: new ObjectId(userId) });

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
