import express from 'express';
import { ObjectId } from 'mongodb';
import { mongoClient } from '../../middleware/auth.js';
import debug from 'debug';
import { validate } from '../../middleware/validator.js';
import { testIdSchema, testUpdateSchema, testUserSchema } from '../../validation/testSchema.js';
import { bugIdSchema } from '../../validation/bugSchema.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { hasPermissions } from '../../middleware/hasPermissions.js';
import { hasAnyRole } from '../../middleware/hasAnyRole.js';
import { hasRole } from '../../middleware/hasRole.js';

const debugPost = debug('test:post');
const debugGet = debug('test:get');
const debugUpdate = debug('test:update');
const debugDelete = debug('test:delete');

const router = express.Router();

// -----------------------------------------------------------------------------
// Add test case to bug
// -----------------------------------------------------------------------------
router.post(
  '/:bugId/tests',
  isAuthenticated,
  hasPermissions('canAddTestCase'),
  hasRole('quality analyst'),
  validate(bugIdSchema, 'params'),
  validate(testUserSchema, 'body'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const { title, description, status } = req.body;
      debugPost(`Creating test case for bug: ${bugId}`);

      const db = mongoClient.db();
      const bugObjectId = new ObjectId(bugId);

      // Check if bug exists
      const bug = await db.collection('bug').findOne({ _id: bugObjectId });

      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      // Create test case
      const testCase = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bugId,
        title,
        description,
        status,
        author: req.user.id,
        authorName: req.user.name,
        createdAt: new Date()
      };

      const result = await db.collection('testCase').insertOne(testCase);

      // Update bug's lastUpdated
      await db.collection('bug').updateOne(
        { _id: bugObjectId },
        { $set: { lastUpdated: new Date() } }
      );

      debugPost(`Test case created for bug: ${bugId}`);

      res.status(200).json({
        message: 'Test case added successfully',
        testCase: {
          ...testCase,
          _id: result.insertedId
        }
      });
    } catch (err) {
      console.error('Create test case error:', err);
      res.status(500).json({ error: 'Failed to create test case' });
    }
  }
);

// -----------------------------------------------------------------------------
// Get all test cases for a bug
// -----------------------------------------------------------------------------
router.get(
  '/:bugId/tests',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      debugGet(`Fetching all test cases for bug: ${bugId}`);

      const db = mongoClient.db();
      const bugObjectId = new ObjectId(bugId);

      // Check if bug exists
      const bug = await db.collection('bug').findOne({ _id: bugObjectId });

      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      const testCases = await db.collection('testCase')
        .find({ bugId })
        .sort({ createdAt: -1 })
        .toArray();

      if (!testCases || testCases.length === 0) {
        return res.status(200).json({
          message: 'No test cases found',
          testCases: []
        });
      }

      res.status(200).json(testCases);
    } catch (err) {
      console.error('Error fetching test cases:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Get specific test case
// -----------------------------------------------------------------------------
router.get(
  '/:bugId/tests/:testId',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(testIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId, testId } = req.params;
      debugGet(`Fetching test case ${testId} from bug ${bugId}`);

      const db = mongoClient.db();
      const testCase = await db.collection('testCase').findOne({
        id: testId,
        bugId: bugId
      });

      if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      res.status(200).json(testCase);
    } catch (err) {
      console.error('Error fetching test case:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Update test case
// -----------------------------------------------------------------------------
router.patch(
  '/:bugId/tests/:testId',
  isAuthenticated,
  hasPermissions('canEditTestCase'),
  hasRole('quality analyst'),
  validate(testIdSchema, 'params'),
  validate(testUpdateSchema, 'body'),
  async (req, res) => {
    try {
      const { bugId, testId } = req.params;
      const updates = req.body;
      debugUpdate(`Updating test case ${testId} for bug ${bugId}`);

      const db = mongoClient.db();
      const bugObjectId = new ObjectId(bugId);

      // Check if test case exists
      const existingTest = await db.collection('testCase').findOne({
        id: testId,
        bugId: bugId
      });

      if (!existingTest) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      // Update test case
      const result = await db.collection('testCase').updateOne(
        { id: testId },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      // Get updated test case
      const updatedTest = await db.collection('testCase').findOne({ id: testId });

      // Update bug's lastUpdated
      await db.collection('bug').updateOne(
        { _id: bugObjectId },
        { $set: { lastUpdated: new Date() } }
      );

      res.status(200).json({
        message: 'Test case updated successfully',
        testCase: updatedTest
      });
    } catch (err) {
      console.error('Update test case error:', err);
      res.status(500).json({ error: 'Failed to update test case' });
    }
  }
);

// -----------------------------------------------------------------------------
// Delete test case
// -----------------------------------------------------------------------------
router.delete(
  '/:bugId/tests/:testId',
  isAuthenticated,
  hasPermissions('canDeleteTestCase'),
  hasRole('quality analyst'),
  validate(testIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId, testId } = req.params;
      debugDelete(`Deleting test case: ${testId}`);

      const db = mongoClient.db();
      const bugObjectId = new ObjectId(bugId);

      // Check if test case exists
      const testCase = await db.collection('testCase').findOne({
        id: testId,
        bugId: bugId
      });

      if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      // Delete test case
      const result = await db.collection('testCase').deleteOne({ id: testId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      // Update bug's lastUpdated
      await db.collection('bug').updateOne(
        { _id: bugObjectId },
        { $set: { lastUpdated: new Date() } }
      );

      res.status(200).json({
        message: 'Test case deleted successfully',
        deletedId: testId
      });
    } catch (err) {
      console.error('Delete test case error:', err);
      res.status(500).json({ error: 'Failed to delete test case' });
    }
  }
);

export { router as testRouter };