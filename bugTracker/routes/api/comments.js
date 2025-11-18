import express from 'express';
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
// Add a comment to a bug
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

            // Check if bug exists
            const bug = await db.collection('bug').findOne({ id: bugId });

            if (!bug) {
                return res.status(404).json({ error: `Bug ${bugId} not found` });
            }

            // Check if user exists
            const user = await db.collection('user').findOne(
                { id: user_id },
                { projection: { id: 1, name: 1, givenName: 1, familyName: 1 } }
            );

            if (!user) {
                return res.status(404).json({ error: `User ${user_id} not found` });
            }

            const authorName = user.givenName && user.familyName
                ? `${user.givenName} ${user.familyName}`.trim()
                : user.name || 'Unknown';

            // Generate unique comment ID
            const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create comment
            const comment = {
                id: commentId,
                bugId,
                text,
                author: user_id,
                authorName,
                createdAt: new Date()
            };

            await db.collection('comment').insertOne(comment);

            // Update bug's lastUpdated
            await db.collection('bug').updateOne(
                { id: bugId },
                { $set: { lastUpdated: new Date() } }
            );

            debugPost(`Comment added successfully to bug ${bugId}`);

            return res.status(200).json({
                message: 'Comment successfully added',
                comment
            });
        } catch (err) {
            console.error('Comment bug error:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
);

// -----------------------------------------------------------------------------
// Find a specific comment by comment id
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
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
);

// -----------------------------------------------------------------------------
// Find all comments on a specific bug id
// -----------------------------------------------------------------------------
router.get('/:bugId/comments', isAuthenticated, hasPermissions('canViewData'), hasAnyRole(['developer', 'business analyst', 'quality analyst', 'product manager', 'technical manager']), validate(bugIdSchema, 'params'), async (req, res) => {
    try {
        const { bugId } = req.params;

        debugGet(`Fetching all comments from bug: ${bugId}`);

        const db = mongoClient.db();
        const comments = await db.collection('comment')
            .find({ bugId })
            .sort({ createdAt: 1 })
            .toArray();

        if (!comments || comments.length === 0) {
            return res.status(404).json({ error: 'Comments not found' });
        }

        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

export { router as commentsRouter };