import express from 'express';
import { getBugs, getDb, getUsers } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { bugCreateSchema, bugIdSchema, bugUpdateSchema, bugClassifySchema, bugAssignSchema, bugCloseSchema} from '../../validation/bugSchema.js';
import { validate } from '../../middleware/validator.js';

// Debug namespaces
const debugList = debug('bugs:list');
const debugGet = debug('bugs:get');
const debugCreate = debug('bugs:create');
const debugUpdate = debug('bugs:update');

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

    if (!bugs || bugs.length === 0) {
      debugList('No bugs found');
      return res.status(404).json({ error: 'No bugs found' });
    }

    debugList(`Found ${bugs.length} bugs`);
    res.status(200).json(bugs);
  } catch (err) {
    console.error('Error fetching bugs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -----------------------------------------------------------------------------
// Get bug by ID
// -----------------------------------------------------------------------------
router.get('/:id', validate(bugIdSchema), async (req, res) => {
  try {
    const db = await getDb();
    const bugId = req.params.id;

    debugGet(`Fetching bug with ID: ${bugId}`);

    if (!ObjectId.isValid(bugId)) {
      debugGet(`Invalid bug ID format: ${bugId}`);
      return res.status(400).json({ error: 'Invalid bug id' });
    }

    const bug = await db.collection('Bugs').findOne(
      { _id: new ObjectId(bugId) },
      {
        projection: {
          title: 1,
          description: 1,
          stepsToReproduce: 1,
          authorOfBug: 1,
          statusLabel: 1,
          classification: 1, 
          createdAt: 1,
          lastUpdated: 1,
          assignedUser: 1,
          assignedUserName: 1
        }
      }
    );

    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    res.status(200).json(bug);
  } catch (err) {
    console.error('Error fetching bug:', err.stack || err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


// -----------------------------------------------------------------------------
// Create new bug
// -----------------------------------------------------------------------------
router.post('/submit', validate(bugCreateSchema), async (req, res) => {
  try {
    debugCreate('Attempting to create new bug');
    const db = await getDb();
    const {title, description, stepsToReproduce, authorOfBug} = req.body;
    
    const newBug = {
      title,
      description,
      stepsToReproduce,
      authorOfBug,
      status: false,
      statusLabel: "open"
    };

    debugCreate('New bug data:', newBug);

    if (!newBug.title || !newBug.description || !newBug.stepsToReproduce) {
      debugCreate('Missing required fields');
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const result = await db.collection('Bugs').insertOne({
      ...newBug,
      creationDate: new Date(),
      lastUpdated: new Date(),
    });

    debugCreate(`New bug created with ID: ${result.insertedId}`);
    res.status(201).json({ 
      message: 'New bug reported', 
      bugId: result.insertedId, 
      creationDate: new Date() 
    });
  } catch (err) {
    debugCreate('Error creating bug:', err);
    res.status(400).json({ error: 'Failed to create bug' });
  }
});

// -----------------------------------------------------------------------------
// Update bug by ID
// -----------------------------------------------------------------------------
router.patch('/:id', validate(bugUpdateSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const bugId = req.params.id;
    const updates = req.body || {};

    updates.lastUpdated = new Date();

    debugUpdate(`Attempting to update bug: ${bugId} with updates: ${JSON.stringify(updates)}`);

    if (!ObjectId.isValid(bugId)) {
      debugUpdate(`Invalid bug ID format: ${bugId}`);
      return res.status(400).json({ error: 'Invalid bug id' });
    }

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: `Bug ${bugId} not found` });
    }

    return res.status(200).json({ 
      message: 'Bug updated successfully', 
      lastUpdated: updates.lastUpdated 
    });
  } catch (err) {
    console.error('Update bug error:', err);
    return res.status(400).json({ error: 'Invalid input' });
  }
});

// -----------------------------------------------------------------------------
// Classify bug by ID
// -----------------------------------------------------------------------------
router.patch('/:id/classify', validate(bugClassifySchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const bugId = req.params.id;
    const updates = req.body || {};

    updates.lastUpdated = new Date();

    debugUpdate(`Attempting to classify bug: ${bugId} with updates: ${JSON.stringify(updates)}`);

    if (!ObjectId.isValid(bugId)) {
      debugUpdate(`Invalid bug ID format: ${bugId}`);
      return res.status(400).json({ error: 'Invalid bug id' });
    }

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: { classification: updates.classification, lastUpdated: updates.lastUpdated } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: `Bug ${bugId} not found` });
    }

    return res.status(200).json({ 
      message: 'Bug classification successfully updated', 
      lastUpdated: updates.lastUpdated 
    });
  } catch (err) {
    console.error('Classify bug error:', err);
    return res.status(400).json({ error: 'Invalid input' });
  }
});

// -----------------------------------------------------------------------------
// Assign a user to a bug
// -----------------------------------------------------------------------------
router.patch('/:id/assign',
validate(bugAssignSchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const db = await getDb();
      const bugId = req.params.id;
      const { user_id } = req.body;

      if (!ObjectId.isValid(bugId) || !ObjectId.isValid(user_id)) {
        debugUpdate(`Invalid bug and/or user id format: ${bugId}, ${user_id}`);
        return res.status(400).json({ error: 'Invalid bug or user id' });
      }

      const bugObjectId = new ObjectId(bugId);
      const userObjectId = new ObjectId(user_id);

      // gets user info to assign it to the bug
      const user = await db.collection('Users').findOne({ _id: userObjectId });
      if (!user) {
        return res.status(404).json({ error: `User ${user_id} not found` });
      }

      const userFullName = user.givenName + ' ' + (user.familyName || '');

      // shows on the bug the assigned user's id and fullname
      const bugUpdates = {
        assignedUser: userObjectId,
        assignedUserName: userFullName.trim(),
        lastUpdated: new Date()
      };

      const bugResult = await db.collection('Bugs').updateOne(
        { _id: bugObjectId },
        { $set: bugUpdates }
      );

      if (bugResult.matchedCount === 0) {
        return res.status(404).json({ error: `Bug ${bugId} not found` });
      }

      // updates user database to show assigned bugs
      await db.collection('Users').updateOne(
        { _id: userObjectId },
        { $addToSet: { assignedBugs: bugObjectId } } 
      );

      return res.status(200).json({
        message: `Bug ${bugId} successfully assigned to ${userFullName}`,
        bug: {
          id: bugId,
          assignedUser: userObjectId,
          assignedUserName: userFullName,
          lastUpdated: bugUpdates.lastUpdated
        }
      });
    } catch (err) {
      console.error('Assign bug error:', err);
      return res.status(400).json({ error: 'Invalid input' });
    }
  }
);


// -----------------------------------------------------------------------------
// Close a bug
// -----------------------------------------------------------------------------
router.patch('/:id/close', validate(bugCloseSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const bugId = req.params.id;

    const updates = {
      status: 'true',
      statusLabel: 'closed',
      lastUpdated: new Date(),
      closedDate: new Date(),
    };

    debugUpdate(`Attempting to close bug: ${bugId}`);

    if (!ObjectId.isValid(bugId)) {
      debugUpdate(`Invalid bug id format: ${bugId}`);
      return res.status(400).json({ error: 'Invalid bug id' });
    }

    const result = await db.collection('Bugs').updateOne(
      { _id: new ObjectId(bugId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: `Bug ${bugId} not found` });
    }

    return res.status(200).json({ 
      message: 'Bug successfully closed', 
      lastUpdated: updates.lastUpdated,
      status: updates.status,
    });
  } catch (err) {
    console.error('Close bug error:', err);
    return res.status(400).json({ error: 'Invalid input' });
  }
});

export { router as bugsRouter };