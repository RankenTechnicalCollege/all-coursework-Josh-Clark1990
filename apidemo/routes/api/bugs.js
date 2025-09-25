import express from 'express';
import { getBugs, getDb } from '../../database.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

//get api endpoint /api/bugs
router.get('', async (req, res) => {
  const bugs =  await getBugs();
  res.status(200).json(bugs);
});

//api to create a new bug using user id
router.post('', async (req, res) => {
  const db = await getDb();
  // use user id when creating a bug
  const creatorId = (req.user && req.user.id) || req.header('x-user-id') || req.body.userId || null;

  const newBug = Object.assign({}, req.body, {
    createdBy: creatorId,
    createdAt: new Date(),
  });

  const result = await db.collection('Bugs').insertOne(newBug);
  res.status(201).json(result);
});

//api to delete a bug by id
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  const bugId = req.params.id;
  const result = await db.collection('Bugs').deleteOne({ _id: new ObjectId(bugId) });
  res.status(200).json(result);
});

//api to update a bug by id
router.put('/:id', async (req, res) => {
  const db = await getDb();
  const bugId = req.params.id;
  const updatedBug = req.body;
  const result = await db.collection('Bugs').updateOne({ _id: new ObjectId(bugId) }, { $set: updatedBug });
  res.status(200).json(result);
});

export {router as bugsRouter};