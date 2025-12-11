import express from 'express';
import { ObjectId } from 'mongodb';
import { mongoClient } from '../../middleware/auth.js';
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

// -----------------------------------------------------------------------------
// Get current user info
// -----------------------------------------------------------------------------
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = mongoClient.db();
    const user = await db.collection('user').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { email: 1, name: 1, role: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: req.user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'developer'
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Get all bugs with filtering, sorting, and pagination
// -----------------------------------------------------------------------------
router.get(
  '/',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  async (req, res) => {
    try {
      debugList('Fetching all bugs');

      const {
        keywords,
        classification,
        minAge,
        maxAge,
        closed,
        assignedToMe,
        page,
        limit,
        sortBy,
        order
      } = req.query;

      console.log('Query params:', { keywords, classification, closed, assignedToMe, sortBy, order });

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build MongoDB query
      const query = {};

      // Keywords search
      if (keywords) {
        query.$or = [
          { title: { $regex: keywords, $options: 'i' } },
          { description: { $regex: keywords, $options: 'i' } },
          { authorOfBug: { $regex: keywords, $options: 'i' }}
        ];
      }

      // Classification filter
      if (classification) {
        query.classification = classification;
      }

      //Filter by current user's assigned bugs
      if (assignedToMe === 'true') {
        const currentUserName = req.user.name; 
        console.log('Filtering bugs assigned to:', currentUserName);
        query.assignedUserName = currentUserName;
      }

      // Status/Closed filter
      if (closed !== undefined) {
        console.log('Applying closed filter:', closed);
        
        if (closed === 'true') {
          query.$and = query.$and || [];
          query.$and.push({
            $or: [
              { closed: true },
              { statusLabel: 'closed' }
            ]
          });
        } else if (closed === 'false') {
          query.$and = query.$and || [];
          query.$and.push({
            $or: [
              { closed: false },
              { closed: { $exists: false } },
              { statusLabel: 'open' }
            ]
          });
        } else if (closed === 'resolved') {
          query.statusLabel = 'resolved';
        }
      }

      // Age filter
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

      console.log('Final query:', JSON.stringify(query, null, 2));

      // Sorting
      const allowedSortFields = ['classification', 'title', 'assignedUserName', 'authorOfBug', 'statusLabel', 'createdAt'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortDirection = order === 'desc' ? -1 : 1;
      const sort = { [sortField]: sortDirection };

      // Projection
      const projection = {
        _id: 1,
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
        closed: 1,
        priority: 1
      };

      const db = mongoClient.db();
      const bugs = await db.collection('bug')
        .find(query)
        .project(projection)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      console.log(`Found ${bugs.length} bugs`);

      if (!bugs.length) {
        return res.status(200).json({ bugs: [] });
      }

      res.status(200).json({ bugs });
    } catch (err) {
      console.error('Error fetching bugs:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
// -----------------------------------------------------------------------------
// Get bug by ID
// -----------------------------------------------------------------------------
router.get(
  '/:bugId',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      debugGet(`Fetching bug with ID: ${bugId}`);

      const db = mongoClient.db();
      const bug = await db.collection('bug').findOne(
        { _id: new ObjectId(bugId) },
        {
          projection: {
            _id: 1,
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
            closedDate: 1,
            priority: 1
          }
        }
      );

      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      res.status(200).json(bug);
    } catch (err) {
      console.error('Error fetching bug:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Create new bug
// -----------------------------------------------------------------------------
router.post(
  '/',
  isAuthenticated,
  hasPermissions('canCreateBug'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager', 'user']),
  validate(bugCreateSchema, 'body'),
  async (req, res) => {
    try {
      const { title, description, stepsToReproduce } = req.body;
      debugCreate('Creating new bug');

      const db = mongoClient.db();

      const newBug = {
        id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        stepsToReproduce,
        authorOfBug: req.user.name,
        status: false,
        statusLabel: 'open',
        closed: false,
        createdAt: new Date(),
        lastUpdated: new Date(),
        priority,
      };

      const result = await db.collection('bug').insertOne(newBug);
      debugCreate(`Bug created with ID: ${newBug.id}`);

      // Log edit
      try {
        const editsDb = await getDb();
        await editsDb.collection('edits').insertOne({
          timestamp: new Date(),
          col: 'Bug',
          op: 'create',
          target: { bugId: newBug.id },
          update: { 
            title, 
            description, 
            stepsToReproduce, 
            authorOfBug: req.user.name
          },
          auth: req.user
        });
      } catch (editErr) {
        console.error('Failed to log edit:', editErr);
      }

      res.status(201).json({
        message: 'New bug reported',
        bugId: result.insertedId.toString(),
        creationDate: newBug.createdAt
      });
    } catch (err) {
      console.error('Error creating bug:', err);
      res.status(500).json({ error: 'Failed to create bug' });
    }
  }
);

// -----------------------------------------------------------------------------
// Update bug by ID
// -----------------------------------------------------------------------------
router.patch(
  '/:bugId',
  isAuthenticated,
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugUpdateSchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const updates = { ...req.body, lastUpdated: new Date() };
      debugUpdate(`Updating bug ${bugId}`);

      const db = mongoClient.db();
      
      // Get the current bug to check previous assignee
      const currentBug = await db.collection('bug').findOne({ _id: new ObjectId(bugId) });
      
      if (!currentBug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      // Handle assignedTo changes
      if ('assignedTo' in updates) {
        const oldAssignee = currentBug.assignedUserName || currentBug.assignedTo;
        const newAssignee = updates.assignedTo;

        // Map assignedTo to assignedUserName for consistency
        updates.assignedUserName = newAssignee;
        delete updates.assignedTo;

        // Remove bug from old assignee's assignedBugs array
        if (oldAssignee && oldAssignee !== newAssignee) {
          await db.collection('user').updateOne(
            { name: oldAssignee },
            { $pull: { assignedBugs: bugId } }
          );
          debugUpdate(`Removed bug ${bugId} from ${oldAssignee}'s assignedBugs`);
        }

        // Add bug to new assignee's assignedBugs array
        if (newAssignee && newAssignee !== oldAssignee) {
          await db.collection('user').updateOne(
            { name: newAssignee },
            { $addToSet: { assignedBugs: bugId } }
          );
          debugUpdate(`Added bug ${bugId} to ${newAssignee}'s assignedBugs`);
        }

        // Remove bug from all users if unassigned
        if (!newAssignee) {
          await db.collection('user').updateMany(
            { assignedBugs: bugId },
            { $pull: { assignedBugs: bugId } }
          );
          debugUpdate(`Unassigned bug ${bugId} from all users`);
        }
      }

      // Update the bug
      const result = await db.collection('bug').updateOne(
        { _id: new ObjectId(bugId) },
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
          target: { bugId },
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
      res.status(500).json({ error: 'Failed to update bug' });
    }
  }
);

// -----------------------------------------------------------------------------
// Classify bug by ID
// -----------------------------------------------------------------------------
router.patch(
  '/:bugId/classify',
  isAuthenticated,
  hasPermissions('canClassifyAnyBug'),
  hasAnyRole(['business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugClassifySchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const { classification } = req.body;
      const lastUpdated = new Date();
      debugClassify(`Classifying bug ${bugId} as ${classification}`);

      const db = mongoClient.db();
      const result = await db.collection('bug').updateOne(
        { _id: new ObjectId(bugId) },
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
          target: { bugId },
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
      res.status(500).json({ error: 'Failed to classify bug' });
    }
  }
);

// -----------------------------------------------------------------------------
// Assign user to bug
// -----------------------------------------------------------------------------
router.patch(
  '/:bugId/assign',
  isAuthenticated,
  hasPermissions('canReassignAnyBug'),
  hasAnyRole(['business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugAssignSchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const { user_id } = req.body;
      debugAssign(`Assigning bug ${bugId} to user ${user_id}`);

      const db = mongoClient.db();
      const userObjectId = new ObjectId(user_id);
      const bugObjectId = new ObjectId(bugId);

      // Check if user exists
      const user = await db.collection('user').findOne(
        { _id: userObjectId },
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
        { _id: bugObjectId },
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
        { _id: userObjectId },
        { $addToSet: { assignedBugs: bugId } }
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
      res.status(500).json({ error: 'Failed to assign bug' });
    }
  }
);

// -----------------------------------------------------------------------------
// Close bug
// -----------------------------------------------------------------------------
router.patch(
  '/:bugId/close',
  isAuthenticated,
  hasPermissions('canCloseAnyBug'),
  hasRole('business analyst, technical manager'),
  validate(bugCloseSchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const lastUpdated = new Date();
      debugClose(`Closing bug ${bugId}`);

      const db = mongoClient.db();
      const result = await db.collection('bug').updateOne(
        { _id: new ObjectId(bugId) },
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
      res.status(500).json({ error: 'Failed to close bug' });
    }
  }
);

export { router as bugsRouter };