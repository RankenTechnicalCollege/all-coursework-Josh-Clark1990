import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { validate } from '../../middleware/validator.js';
import jwt from 'jsonwebtoken';
import { getAuth } from '../../middleware/auth.js';
import { isLoggedIn } from '../../middleware/isLoggedIn.js';

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
router.get('/', isLoggedIn, async (req, res) => {
  try {
    console.log('Fetching all users');
    const db = await getDb();
    const usersCollection = db.collection('Users');

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
router.get('/:id', isLoggedIn, validate(userIdSchema), async (req, res) => {
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

        const editRecord = {
            timestamp: new Date(),
            col: "user",
            op: "insert",
            target: { userId: result.insertedId },
            update: userToInsert,
            };

        await db.collection("edits").insertOne(editRecord);
        debugCreate(`Edit log added for user ${result.insertedId}`);   

        res.status(201).json({
            message: 'New User registered!',
            userId: result.insertedId
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
// Login
// -----------------------------------------------------------------------------
router.post('/login', validate(loginSchema, 'body'), async (req, res) => {
  try {
    const auth = getAuth(); 
    console.log('Auth db type:', auth.database.db?.constructor.name);
    const { email, password } = req.body;

    console.log('Attempting login with:', { email, password });

    const authUser = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!authUser || !authUser.session)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Set auth cookie
    res.cookie('auth_token', authUser.session.token, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      message: `Login successful. Welcome back ${authUser.user?.givenName}!`,
      user: authUser.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});



// -----------------------------------------------------------------------------
// User updates their own info
// -----------------------------------------------------------------------------
router.patch('/me', isLoggedIn, validate(userUpdateSchema, 'body'), async (req, res) => {
    try{
        const db = await getDb();
        const userId = req.user.id;
        const updates = req.body || {};
        updates.lastUpdated = new Date();

        // hash password if password is being updated
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
            debugUpdate('Password successfully hashed and updated');
            delete updates.confirmPassword;
        }

        debugUpdate(`User ${userId} updating their info with: ${JSON.stringify(updates)}`);

        await users.updateOne(
            { _id: new ObjectId(userId) },
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
        
        //issues new token 
        const newToken = jwt.sign(
            { id: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        res.cookie('jwt', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.status(200).json({ message: 'Your info has been successfully updated', lastUpdated: updates.lastUpdated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' })
    }
});


// -----------------------------------------------------------------------------
// Update user by ID (eventually changed for only admins)
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
