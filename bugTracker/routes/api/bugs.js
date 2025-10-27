import express from 'express';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

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
// Get all bugs
// -----------------------------------------------------------------------------
router.get('/', isAuthenticated, async (req, res) => {
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

    // Build where clause
    const where = {};
    
    if (keywords) {
      where.OR = [
        { title: { contains: keywords, mode: 'insensitive' } },
        { description: { contains: keywords, mode: 'insensitive' } }
      ];
    }
    
    if (classification) {
      where.classification = classification;
    }
    
    if (closed !== undefined) {
      where.closed = closed === 'true';
    }

    if (minAge || maxAge) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      where.createdAt = {};
      if (maxAge) {
        where.createdAt.gte = new Date(today.getTime() - maxAge * 24 * 60 * 60 * 1000);
      }
      if (minAge) {
        where.createdAt.lte = new Date(today.getTime() - minAge * 24 * 60 * 60 * 1000);
      }
    }

    // Sorting
    const allowedSortFields = ['classification', 'title', 'assignedUserName', 'authorOfBug', 'statusLabel', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = order === 'desc' ? 'desc' : 'asc';
    const orderBy = { [sortField]: sortDirection };

    // Query
    const bugs = await prisma.bug.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        stepsToReproduce: true,
        statusLabel: true,
        classification: true,
        assignedUserName: true,
        authorOfBug: true,
        createdAt: true,
        lastUpdated: true,
        closed: true
      },
      orderBy,
      skip,
      take: limitNum
    });

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
router.get('/:bugId', isAuthenticated, validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    debugGet(`Fetching bug with ID: ${bugId}`);

    const bug = await prisma.bug.findUnique({
      where: { id: bugId },
      select: {
        id: true,
        title: true,
        description: true,
        stepsToReproduce: true,
        authorOfBug: true,
        statusLabel: true,
        classification: true,
        createdAt: true,
        lastUpdated: true,
        assignedUser: true,
        assignedUserName: true,
        closed: true,
        closedDate: true
      }
    });

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
router.post('', isAuthenticated, validate(bugCreateSchema, 'body'), async (req, res) => {
  try {
    const { title, description, stepsToReproduce, authorOfBug } = req.body;
    debugCreate('Creating new bug');

    const newBug = await prisma.bug.create({
      data: {
        title,
        description,
        stepsToReproduce,
        authorOfBug,
        status: false,
        statusLabel: 'open'
      }
    });

    debugCreate(`Bug created with ID: ${newBug.id}`);

                await db.collection('edits').insertOne({
                timestamp: new Date(),
                col: 'bug',
                op: 'update',
                target: { bugId: bugId },
                update: updates,
                auth: req.user
            });

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
router.patch('/:bugId', isAuthenticated, validate(bugUpdateSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const updates = req.body || {};
    debugUpdate(`Updating bug ${bugId}`);

    const updatedBug = await prisma.bug.update({
      where: { id: bugId },
      data: updates
    });

    res.status(200).json({
      message: 'Bug updated successfully',
      lastUpdated: updatedBug.lastUpdated
    });
    
      await db.collection('edits').insertOne({
                timestamp: new Date(),
                col: 'bug',
                op: 'update',
                target: { bugId: bugId },
                update: updates,
                auth: req.user
            });

  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bug not found' });
    }
    console.error('Update bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Classify bug by ID
// -----------------------------------------------------------------------------
router.patch('/:bugId/classify', isAuthenticated, validate(bugClassifySchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const { classification } = req.body;
    debugClassify(`Classifying bug ${bugId} as ${classification}`);

    const updatedBug = await prisma.bug.update({
      where: { id: bugId },
      data: { classification }
    });

            await db.collection('edits').insertOne({
                timestamp: new Date(),
                col: 'bug',
                op: 'update',
                target: { bugId: bugId },
                update: updates,
                auth: req.user
            });

    res.status(200).json({
      message: 'Bug classification updated',
      lastUpdated: updatedBug.lastUpdated
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bug not found' });
    }
    console.error('Classify bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Assign a user to a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/assign', isAuthenticated, validate(bugAssignSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    const { user_id } = req.body;
    debugAssign(`Assigning bug ${bugId} to user ${user_id}`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { givenName: true, familyName: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userFullName = user.givenName && user.familyName 
      ? `${user.givenName} ${user.familyName}`.trim()
      : user.name || 'Unknown';

    // Update bug with assigned user
    const updatedBug = await prisma.bug.update({
      where: { id: bugId },
      data: {
        assignedUser: user_id,
        assignedUserName: userFullName
      }
    });

    // Update user's assignedBugs array
    await prisma.user.update({
      where: { id: user_id },
      data: {
        assignedBugs: {
          push: bugId
        }
      }
    });

    res.status(200).json({
      message: `Bug assigned to ${userFullName}`,
      bug: {
        id: updatedBug.id,
        assignedUser: user_id,
        assignedUserName: userFullName,
        lastUpdated: updatedBug.lastUpdated
      }
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bug not found' });
    }
    console.error('Assign bug error:', err);
    res.status(500).json({ error: 'Failed to assign bug', details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Close a bug
// -----------------------------------------------------------------------------
router.patch('/:bugId/close', isAuthenticated, validate(bugCloseSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const { bugId } = req.params;
    debugClose(`Closing bug ${bugId}`);

    const updatedBug = await prisma.bug.update({
      where: { id: bugId },
      data: {
        status: true,
        statusLabel: 'closed',
        closed: true,
        closedDate: new Date()
      }
    });

    res.status(200).json({
      message: 'Bug closed',
      lastUpdated: updatedBug.lastUpdated
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bug not found' });
    }
    console.error('Close bug error:', err);
    res.status(500).json({ error: 'Invalid input', details: err.message });
  }
});

export { router as bugsRouter };