import express from 'express'
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import {validate} from '../../middleware/validator.js';
import { testUserSchema } from '../../validation/testSchema.js';
import { bugIdSchema} from '../../validation/bugSchema.js';

const debugPost = debug('test:post')

const router = express.Router();


// -----------------------------------------------------------------------------
// Add a test case to a bug
// -----------------------------------------------------------------------------
router.post(
  '/:bugId/tests',
  validate(bugIdSchema, 'params'),
  validate(testUserSchema, 'body'),
  async (req, res) => {
    try {
      const db = await getDb();
      const { bugId } = req.params;
      const { title, description, status, author_id } = req.body;

      debugPost(`Creating test case for bug: ${bugId}`);

      if (!ObjectId.isValid(bugId) || !ObjectId.isValid(author_id)) {
        return res.status(400).json({ error: 'Invalid bug or user ID' });
      }

      const bug = await db.collection('Bugs').findOne({ _id: new ObjectId(bugId) });
      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      const user = await db.collection('Users').findOne({ _id: new ObjectId(author_id) });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role !== 'quality analyst') {
        return res.status(403).json({ error: 'User must be a quality analyst to add test cases' });
      }

      const testCase = {
        _id: new ObjectId(),
        title,
        description,
        status,
        author: {
          id: user._id,
          name: user.fullName
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('Bugs').updateOne(
        { _id: new ObjectId(bugId) },
        { $push: { testCases: testCase }, $set: { lastUpdated: new Date() } }
      );

      debugPost(`Test case created successfully for bug: ${bugId}`);

      res.status(200).json({ message: 'Test case added', testCase });
    } catch (err) {
      debugPost('Error creating test case', err);
      res.status(500).json({ error: 'Failed to create test case' });
    }
  }
);


// -----------------------------------------------------------------------------
// Get all test cases from a bug
// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------
// Get a specific test case from a bug
// -----------------------------------------------------------------------------



// -----------------------------------------------------------------------------
// Edit a test case for a bug
// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------
// Delete a test case from a bug
// -----------------------------------------------------------------------------

export { router as testRouter }