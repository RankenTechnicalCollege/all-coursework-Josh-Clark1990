import express from 'express';
import { getUsers, getDb } from '../../database.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

//get api endpoint /api/users
router.get('', async (req, res) => {
  const users =  await getUsers();
  res.status(200).json(users);
 
});

//api to create a new user
router.post('', async (req, res) => {
  const db = await getDb();
  const newUser = req.body || {};

  // Minimal validation
  if (!newUser.name && !newUser.email) {
    return res.status(400).json({ error: 'Missing required user fields: name or email' });
  }

  const userToInsert = Object.assign({}, newUser, { createdAt: new Date() });
  const result = await db.collection('Users').insertOne(userToInsert);
  res.status(201).json({ insertedId: result.insertedId });
});

//api to find a user by id
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  const user = await db.collection('Users').findOne({ _id: new ObjectId(userId) });
  res.status(200).json(user);
});

//api to delete a user by id
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  const result = await db.collection('Users').deleteOne({ _id: new ObjectId(userId) });
  res.status(200).json(result);
});

//api to update a user by id
router.put('/:id', async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;
  const updatedUser = req.body;
  const result = await db.collection('Users').updateOne({ _id: new ObjectId(userId) }, { $set: updatedUser });
  res.status(200).json(result);
});

export {router as usersRouter};