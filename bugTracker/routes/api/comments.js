import express from 'express'
import { getBugs, getDb, getUsers } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { bugCommentSchema, bugIdSchema, bugCommentSearchSchema } from '../../../validation/bugSchema.js';
import { validate } from '../../middleware/validator.js';


const debugGet = debug('comments:get')

const router = express.Router();

// -----------------------------------------------------------------------------
// Add a comment to a bug
// -----------------------------------------------------------------------------
router.post('/:bugId/comments', validate(bugCommentSchema, 'body'), validate(bugIdSchema, 'params'), async (req, res) => {
  try {
    const db = await getDb();
    const bugId = req.params.bugId;
    const { user_id, text } = req.body;

    if (!ObjectId.isValid(bugId) || !ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid bug or user id' });
    }

    const bugObjectId = new ObjectId(bugId);
    const userObjectId = new ObjectId(user_id);

    const user = await db.collection('Users').findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ error: `User ${user_id} not found` });
    }

   
    const comment = {
      _id: new ObjectId(),
      text,
      user: {
        id: user._id,
        name: user.fullName
      },
      date: new Date()
    };  

    const bugResult = await db.collection('Bugs').updateOne(
      { _id: bugObjectId },
      {
        $push: { comments: comment }, 
        $set: { lastUpdated: new Date() },
      }
    );

    if (bugResult.matchedCount === 0) {
      return res.status(404).json({ error: `Bug ${bugId} not found` });
    }

    return res.status(200).json({
      message: 'Comment successfully added',
      comment,
    });
  } catch (err) {
    console.error('Comment bug error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Find a specific comment by comment id
// -----------------------------------------------------------------------------
router.get(
  '/:bugId/comments/:commentId',
  validate(bugCommentSearchSchema, 'params'),
  async (req, res) => {
    try {
      const db = await getDb();
      const { bugId, commentId } = req.params;

      debugGet(`Fetching comment ${commentId} from bug ${bugId}`);

      if (!ObjectId.isValid(bugId) || !ObjectId.isValid(commentId)) {
        return res.status(400).json({ error: 'Invalid comment or bug id' });
      }

      const bug = await db.collection('Bugs').findOne(
        { _id: new ObjectId(bugId) },
        { projection: { comments: 1 } }
      );

      if (!bug || !bug.comments || bug.comments.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const comment = bug.comments.find(c => c._id.toString() === commentId);

      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      res.status(200).json(comment);
    } catch (err) {
      console.error('Error fetching comment:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
);




// -----------------------------------------------------------------------------
// Find all comments on a specific bug id
// -----------------------------------------------------------------------------


export { router as commentsRouter };