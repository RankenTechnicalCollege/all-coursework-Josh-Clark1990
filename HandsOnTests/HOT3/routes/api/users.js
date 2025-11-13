import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import { hasRole } from  '../../middleware/hasRole.js';
import { auth } from '../../middleware/auth.js';
import { userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { validate } from '../../middleware/validator.js';

const router = express.Router();

const isValidObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

//Get all users-------------------------------------------------------------------------------------------------------------------
router.get('/', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('user').find().toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    return res.status(200).json(users);
  } catch (err) {
    console.error('FULL ERROR', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//User views their own info-------------------------------------------------------------------------------------------------------
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;

    let user = null;
    if (isValidObjectId(userId)) {
      try {
        user = await db.collection('user').findOne({ _id: new ObjectId(userId) }); 
      } catch (e) {
        console.warn('users/me - ObjectId lookup failed, falling back', e.message);
      }
    }

    if (!user && userId) {
      user = await db.collection('user').findOne({ id: userId }); 
    }

    if (!user && req.user?.email) {
      user = await db.collection('user').findOne({ email: req.user.email }); 
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('FULL ERROR', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//User updates their own info (user/me)---------------------------------------------------------------------------------------------
router.patch('/me', isAuthenticated, validate(userUpdateSchema, 'body'), async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id; 
    const updates = req.body || {};

    updates.lastUpdated = new Date();

    let filter = null;
    if (isValidObjectId(userId)) {
      try {
        filter = { _id: new ObjectId(userId) };
      } catch (e) {
        console.warn('users PATCH /me - invalid ObjectId, falling back', e.message);
        filter = { id: userId };
      }
    } else if (userId) {
      filter = { id: userId };
    } else if (req.user?.email) {
      filter = { email: req.user.email };
    } else {
      return res.status(400).json({ error: 'Cannot determine user to update' });
    }

    const result = await db.collection('user').updateOne(filter, { $set: updates }); 

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'User successfully updated', 
      lastUpdated: updates.lastUpdated 
    });
  } catch (err) {
    console.error('FULL ERROR', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//Get user by ID---------------------------------------------------------------------------------------------------------------------
router.get('/:id', isAuthenticated, hasRole('admin'), validate(userIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    let user = null;
    if (isValidObjectId(id)) {
      try {
        user = await db.collection('user').findOne({ _id: new ObjectId(id) }); 
      } catch (e) {
        console.warn('users/:id - ObjectId lookup failed, falling back to id field', e.message);
      }
    }

    if (!user) {
      user = await db.collection('user').findOne({ id }); 
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('FULL ERROR', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export { router as usersRouter };