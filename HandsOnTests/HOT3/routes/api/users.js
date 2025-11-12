import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import { hasRole } from  '../../middleware/hasRole.js';
import { auth } from '../../middleware/auth.js';
import { userIdSchema, userUpdateSchema } from '../../validation/userSchema.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { validate } from '../../middleware/validator.js';

const router = express.Router();


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

//Get user by ID---------------------------------------------------------------------------------------------------------------------
router.get('/:id', isAuthenticated, hasRole('admin'), validate(userIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('FULL ERROR', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//User views their own info-------------------------------------------------------------------------------------------------------
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id; // Get the logged-in user's ID
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

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

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    );

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

export { router as usersRouter };