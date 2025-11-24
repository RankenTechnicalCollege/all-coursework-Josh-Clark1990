import express from 'express';
import { mongoClient } from '../../middleware/auth.js';
import { ObjectId } from 'mongodb';
import { getDb } from '../../database.js';
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
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { hasPermissions } from '../../middleware/hasPermissions.js';
import { hasRole } from '../../middleware/hasRole.js';
import { hasAnyRole } from '../../middleware/hasAnyRole.js';

// Debug namespaces
const debugList = debug('bugs:list');
const debugGet = debug('bugs:get');
const debugCreate = debug('bugs:create');
const debugUpdate = debug('bugs:update');
const debugClassify = debug('bugs:classify');
const debugAssign = debug('bugs:assign');
const debugClose = debug('bugs:close');

const router = express.Router();

router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const db = mongoClient.db();
  console.log('🔍 Searching for user with id:', req.user.id);
  
  // Try finding by 'id' field first
  let user = await db.collection('user').findOne({ id: req.user.id });
  console.log('🔍 Found by id field:', user);
  
  // If not found, try by _id
  if (!user) {
    try {
      user = await db.collection('user').findOne({ _id: new ObjectId(req.user.id) });
      console.log('🔍 Found by _id field:', user);
    } catch (err) {
      console.log('🔍 Could not search by _id:', err.message);
    }
  }
  
  if (!user) {
    return res.status(404).json({ error: 'User not found in database' });
  }
  
  res.json({
    id: req.user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'developer'
  });
});


// -----------------------------------------------------------------------------
// Get all bugs
// -----------------------------------------------------------------------------
router.get('/', isAuthenticated, hasPermissions('canViewData'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), async (req, res) => {
  try {
    debugList('Fetching all bugs');
    
    const {
      keywords,
      classification,
      minAge,
      maxAge,
      closed,
      page,
      limit,
      sortBy,
      order
    } = req.query;

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build MongoDB query
    const query = {};
    
    if (keywords) {
      query.$or = [
        { title: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } }
      ];
    }
    
    if (classification) {
      query.classification = classification;
    }
    
    if (closed !== undefined) {
      query.closed = closed === 'true';
    }

    if (minAge || maxAge) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      query.createdAt = {};
      if (maxAge) {
        query.createdAt.$gte = new Date(today.getTime() - maxAge * 24 * 60 * 60 * 1000);
      }
      if (minAge) {
        query.createdAt.$lte = new Date(today.getTime() - minAge * 24 * 60 * 60 * 1000);
      }
    }

    // Sorting
    const allowedSortFields = ['classification', 'title', 'assignedUserName', 'authorOfBug', 'statusLabel', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortDirection };

    // Projection (select fields)
    const projection = {
      id: 1,
      title: 1,
      description: 1,
      stepsToReproduce: 1,
      statusLabel: 1,
      classification: 1,
      assignedUserName: 1,
      authorOfBug: 1,
      createdAt: 1,
      lastUpdated: 1,
      closed: 1
    };

    // Query
    const db = mongoClient.db();
    const bugs = await db.collection('bug')
      .find(query)
      .project(projection)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    if (!bugs.length) {
      return res.status(404).json({ error: 'No bugs found' });
    }

    res.status(200).json(bugs);
  } catch (err) {
    console.error('Error fetching bugs:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Get bug by ID
// -----------------------------------------------------------------------------
router.get('/:bugId', isAuthenticated, hasPermissions('canViewData'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    debugGet(`Fetching bug with ID: ${bugId}`);

    const db = mongoClient.db();
    const bug = await db.collection('bug').findOne(
      { id: bugId },
      {
        projection: {
          id: 1,
          title: 1,
          description: 1,
          stepsToReproduce: 1,
          authorOfBug: 1,
          statusLabel: 1,
          classification: 1,
          createdAt: 1,
          lastUpdated: 1,
          assignedUser: 1,
          assignedUserName: 1,
          closed: 1,
          closedDate: 1
        }
      }
    );

    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    res.status(200).json(bug);
  } catch (err) {
    console.error('Error fetching bug:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Create new bug
// -----------------------------------------------------------------------------
router.post('/', isAuthenticated, hasPermissions('canCreateBug'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugCreateSchema, 'body'), async (req, res) => {
  try {
    const { title, description, stepsToReproduce, authorOfBug } = req.body;
    debugCreate('Creating new bug');

    const db = mongoClient.db();
    
    // Generate a unique ID (you can use a better ID generation method)
    const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newBug = {
      id: bugId,
      title,
      description,
      stepsToReproduce,
      authorOfBug,
      status: false,
      statusLabel: 'open',
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    await db.collection('bug').insertOne(newBug);

    debugCreate(`Bug created with ID: ${newBug.id}`);

    // Log edit
    try {
      const editsDb = await getDb();
      await editsDb.collection('edits').insertOne({
        timestamp: new Date(),
        col: 'Bug',
        op: 'create',
        target: { bugId: newBug.id },
        update: { title, description, stepsToReproduce, authorOfBug },
        auth: req.user
      });
    } catch (editErr) {
      console.error('Failed to log edit:', editErr);
    }

    res.status(201).json({
      message: 'New bug reported',
      bugId: newBug.id,
      creationDate: newBug.createdAt
    });
  } catch (err) {
    console.error('Error creating bug:', err);
    res.status(500).json({ error: 'Failed to create bug', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Update bug by ID
// -----------------------------------------------------------------------------
router.patch('/:bugId', isAuthenticated, hasPermissions('canEditAnyBug'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugUpdateSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const updates = req.body || {};
    debugUpdate(`Updating bug ${bugId}`);

    // Add lastUpdated timestamp
    updates.lastUpdated = new Date();

    const db = mongoClient.db();
    const result = await db.collection('bug').updateOne(
      { id: bugId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    // Log edit
    try {
      const editsDb = await getDb();
      await editsDb.collection('edits').insertOne({
        timestamp: new Date(),
        col: 'Bug',
        op: 'update',
        target: { bugId: bugId },
        update: updates,
        auth: req.user
      });
    } catch (editErr) {
      console.error('Failed to log edit:', editErr);
    }

    res.status(200).json({
      message: 'Bug updated successfully',
      lastUpdated: updates.lastUpdated
    });

  } catch (err) {
    console.error('Update bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Classify bug by ID
// -----------------------------------------------------------------------------
router.patch('/:bugId/classify', isAuthenticated, hasPermissions('canClassifyAnyBug'), hasAnyRole(['business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugClassifySchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const { classification } = req.body;
    debugClassify(`Classifying bug ${bugId} as ${classification}`);

    const db = mongoClient.db();
    const lastUpdated = new Date();
    
    const result = await db.collection('bug').updateOne(
      { id: bugId },
      { $set: { classification, lastUpdated } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    // Log edit
    try {
      const editsDb = await getDb();
      await editsDb.collection('edits').insertOne({
        timestamp: new Date(),
        col: 'Bug',
        op: 'classify',
        target: { bugId: bugId },
        update: { classification },
        auth: req.user
      });
    } catch (editErr) {
      console.error('Failed to log edit:', editErr);
    }

    res.status(200).json({
      message: 'Bug classification updated',
      lastUpdated
    });
  } catch (err) {
    console.error('Classify bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Assign a user to a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/assign', isAuthenticated, hasPermissions('canReassignAnyBug'), hasAnyRole(['business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugAssignSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const { user_id } = req.body;
    debugAssign(`Assigning bug ${bugId} to user ${user_id}`);

    const db = mongoClient.db();

    // Check if user exists
    const user = await db.collection('user').findOne(
      { id: user_id },
      { projection: { givenName: 1, familyName: 1, name: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userFullName = user.givenName && user.familyName 
      ? `${user.givenName} ${user.familyName}`.trim()
      : user.name || 'Unknown';

    const lastUpdated = new Date();

    // Update bug with assigned user
    const bugResult = await db.collection('bug').updateOne(
      { id: bugId },
      { 
        $set: {
          assignedUser: user_id,
          assignedUserName: userFullName,
          lastUpdated
        }
      }
    );

    if (bugResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    // Update user's assignedBugs array
    await db.collection('user').updateOne(
      { id: user_id },
      { $addToSet: { assignedBugs: bugId } } // Use $addToSet to avoid duplicates
    );

    res.status(200).json({
      message: `Bug assigned to ${userFullName}`,
      bug: {
        id: bugId,
        assignedUser: user_id,
        assignedUserName: userFullName,
        lastUpdated
      }
    });
  } catch (err) {
    console.error('Assign bug error:', err);
    res.status(500).json({ error: 'Failed to assign bug', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Close a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/close', isAuthenticated, hasPermissions('canCloseAnyBug'), hasRole('business analyst'), validate(bugCloseSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    debugClose(`Closing bug ${bugId}`);

    const db = mongoClient.db();
    const lastUpdated = new Date();
    
    const result = await db.collection('bug').updateOne(
      { id: bugId },
      { 
        $set: {
          status: true,
          statusLabel: 'closed',
          closed: true,
          closedDate: new Date(),
          lastUpdated
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    res.status(200).json({
      message: 'Bug closed',
      lastUpdated
    });
  } catch (err) {
    console.error('Close bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

export { router as bugsRouter };