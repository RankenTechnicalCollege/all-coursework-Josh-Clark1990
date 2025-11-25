import express from 'express';
import { ObjectId } from 'mongodb';
import { mongoClient } from '../../middleware/auth.js';
import debug from 'debug';
import { bugCommentSchema, bugIdSchema, bugCommentSearchSchema } from '../../validation/bugSchema.js';
import { validate } from '../../middleware/validator.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { hasPermissions } from '../../middleware/hasPermissions.js';
import { hasAnyRole } from '../../middleware/hasAnyRole.js';

const debugGet = debug('comments:get');
const debugPost = debug('comments:post');

const router = express.Router();

// -----------------------------------------------------------------------------
// Add comment to bug
// -----------------------------------------------------------------------------
router.post(
  '/:bugId/comments',
  isAuthenticated,
  hasPermissions('canAddComment'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugCommentSchema, 'body'),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      const { user_id, text } = req.body;
      debugPost(`Adding comment to bug ${bugId}`);

      const db = mongoClient.db();
      const bugObjectId = new ObjectId(bugId);
      const userObjectId = new ObjectId(user_id);

      // Check if bug exists
      const bug = await db.collection('bug').findOne({ _id: bugObjectId });

      if (!bug) {
        return res.status(404).json({ error: 'Bug not found' });
      }

      // Check if user exists
      const user = await db.collection('user').findOne(
        { _id: userObjectId },
        { projection: { name: 1, givenName: 1, familyName: 1 } }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const authorName = user.givenName && user.familyName
        ? `${user.givenName} ${user.familyName}`.trim()
        : user.name || 'Unknown';

      // Create comment
      const comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bugId,
        text,
        author: user_id,
        authorName,
        createdAt: new Date()
      };

      const result = await db.collection('comment').insertOne(comment);

      // Update bug's lastUpdated
      await db.collection('bug').updateOne(
        { _id: bugObjectId },
        { $set: { lastUpdated: new Date() } }
      );

      debugPost(`Comment added to bug ${bugId}`);

      res.status(200).json({
        message: 'Comment added successfully',
        comment: {
          ...comment,
          _id: result.insertedId
        }
      });
    } catch (err) {
      console.error('Add comment error:', err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

// -----------------------------------------------------------------------------
// Get specific comment by ID
// -----------------------------------------------------------------------------
router.get(
  '/:bugId/comments/:commentId',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugCommentSearchSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId, commentId } = req.params;
      debugGet(`Fetching comment ${commentId} from bug ${bugId}`);

      const db = mongoClient.db();
      const comment = await db.collection('comment').findOne({
        id: commentId,
        bugId: bugId
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.status(200).json(comment);
    } catch (err) {
      console.error('Error fetching comment:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// -----------------------------------------------------------------------------
// Get all comments for a bug
// -----------------------------------------------------------------------------
router.get(
  '/:bugId/comments',
  isAuthenticated,
  hasPermissions('canViewData'),
  hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']),
  validate(bugIdSchema, 'params'),
  async (req, res) => {
    try {
      const { bugId } = req.params;
      debugGet(`Fetching all comments for bug: ${bugId}`);

      const db = mongoClient.db();
      const comments = await db.collection('comment')
        .find({ bugId })
        .sort({ createdAt: 1 })
        .toArray();

      if (!comments || comments.length === 0) {
        return res.status(404).json({ error: 'No comments found' });
      }

      res.status(200).json(comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export { router as commentsRouter };