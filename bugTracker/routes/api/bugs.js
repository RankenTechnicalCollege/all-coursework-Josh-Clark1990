import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { 
  bugCreateSchema, 
  bugIdSchema, 
  bugUpdateSchema, 
  bugClassifySchema, 
  bugAssignSchema, 
  bugCloseSchema 
} from '../../validation/bugSchema.js';
import { validate } from '../../middleware/validator.js';

// Debug namespaces
const debugList = debug('bugs:list');

const router = express.Router();

// -----------------------------------------------------------------------------
// Get all bugs
// -----------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    debugList('Fetching all bugs');

    const bugs = await db.collection('Bugs').find(
      {}, 
      {
        projection: {
          title: 1,
          description: 1,
          stepsToReproduce: 1,
          statusLabel: 1, 
          createdAt: 1,
          lastUpdated: 1
        }
      }
    ).toArray();

    if (!bugs.length) return res.status(404).json({ error: 'No bugs found' });

    res.status(200).json(bugs);
  } catch (err) {
    console.error('Error fetching bugs:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Get bug by ID
// -----------------------------------------------------------------------------
router.get('/:bugId', validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { bugId } = req.params;

    if (!ObjectId.isValid(bugId)) return res.status(400).json({ error: 'Invalid bug id' });

    const bug = await db.collection('Bugs').findOne(
      { _id: new ObjectId(bugId) },
      { projection: { title: 1, description: 1, stepsToReproduce: 1, authorOfBug: 1, statusLabel: 1, classification: 1, createdAt: 1, lastUpdated: 1, assignedUser: 1, assignedUserName: 1 } }
    );

    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    res.status(200).json(bug);
  } catch (err) {
    console.error('Error fetching bug:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Create new bug
// -----------------------------------------------------------------------------
router.post('/submit', validate(bugCreateSchema, 'body'), async (req, res) => {
  try {
    const db = await getDb();
    const { title, description, stepsToReproduce, authorOfBug } = req.body;

    const newBug = {
      title,
      description,
      stepsToReproduce,
      authorOfBug,
      status: false,
      statusLabel: "open",
      creationDate: new Date(),
      lastUpdated: new Date(),
    };

    const result = await db.collection('Bugs').insertOne(newBug);

    res.status(201).json({ message: 'New bug reported', bugId: result.insertedId, creationDate: newBug.creationDate });
  } catch (err) {
    console.error('Error creating bug:', err);
    res.status(500).json({ error: 'Failed to create bug', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Update bug by ID
// -----------------------------------------------------------------------------
router.patch('/:bugId', validate(bugUpdateSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { bugId } = req.params;
    const updates = req.body || {};
    updates.lastUpdated = new Date();

    if (!ObjectId.isValid(bugId)) return res.status(400).json({ error: 'Invalid bug id' });

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: updates }
    );

    if (!result.matchedCount) return res.status(404).json({ error: 'Bug not found' });

    res.status(200).json({ message: 'Bug updated successfully', lastUpdated: updates.lastUpdated });
  } catch (err) {
    console.error('Update bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Classify bug by ID
// -----------------------------------------------------------------------------
router.patch('/:bugId/classify', validate(bugClassifySchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { bugId } = req.params;
    const { classification } = req.body;

    if (!ObjectId.isValid(bugId)) return res.status(400).json({ error: 'Invalid bug id' });

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: { classification, lastUpdated: new Date() } }
    );

    if (!result.matchedCount) return res.status(404).json({ error: 'Bug not found' });

    res.status(200).json({ message: 'Bug classification updated', lastUpdated: new Date() });
  } catch (err) {
    console.error('Classify bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Assign a user to a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/assign', validate(bugAssignSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { bugId } = req.params;
    const { user_id } = req.body;

    if (!ObjectId.isValid(bugId) || !ObjectId.isValid(user_id)) return res.status(400).json({ error: 'Invalid bug or user id' });

    const bugObjectId = new ObjectId(bugId);
    const userObjectId = new ObjectId(user_id);

    const user = await db.collection('Users').findOne({ _id: userObjectId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userFullName = `${user.givenName} ${user.familyName || ''}`.trim();

    const result = await db.collection('Bugs').updateOne(
      { _id: bugObjectId },
      { $set: { assignedUser: userObjectId, assignedUserName: userFullName, lastUpdated: new Date() } }
    );

    if (!result.matchedCount) return res.status(404).json({ error: 'Bug not found' });

    await db.collection('Users').updateOne(
      { _id: userObjectId },
      { $addToSet: { assignedBugs: bugObjectId } }
    );

    res.status(200).json({
      message: `Bug assigned to ${userFullName}`,
      bug: { id: bugId, assignedUser: userObjectId, assignedUserName: userFullName, lastUpdated: new Date() }
    });
  } catch (err) {
    console.error('Assign bug error:', err);
    res.status(500).json({ error: 'Failed to assign bug', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Close a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/close', validate(bugCloseSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const { bugId } = req.params;

    if (!ObjectId.isValid(bugId)) return res.status(400).json({ error: 'Invalid bug id' });

    const updates = { status: true, statusLabel: 'closed', lastUpdated: new Date(), closedDate: new Date() };

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: updates }
    );

    if (!result.matchedCount) return res.status(404).json({ error: 'Bug not found' });

    res.status(200).json({ message: 'Bug closed', lastUpdated: updates.lastUpdated });
  } catch (err) {
    console.error('Close bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

export { router as bugsRouter };
