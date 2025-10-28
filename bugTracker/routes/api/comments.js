import express from 'express';
import { PrismaClient } from '@prisma/client';
import debug from 'debug';
import { bugCommentSchema, bugIdSchema, bugCommentSearchSchema } from '../../validation/bugSchema.js';
import { validate } from '../../middleware/validator.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { hasPermissions } from '../../middleware/hasPermissions.js';
import { hasAnyRole } from '../../middleware/hasAnyRole.js';

const prisma = new PrismaClient();
const debugGet = debug('comments:get');
const debugPost = debug('comments:post');

const router = express.Router();

// -----------------------------------------------------------------------------
// Add a comment to a bug
// -----------------------------------------------------------------------------
router.post(
    '/:bugId/comments',
    isAuthenticated,
    hasPermissions('canAddComments'),
    hasAnyRole,
    validate(bugCommentSchema, 'body'),
    validate(bugIdSchema, 'params'),
    async (req, res) => {
        try {
            const { bugId } = req.params;
            const { user_id, text } = req.body;

            debugPost(`Adding comment to bug ${bugId}`);

            // Check if bug exists
            const bug = await prisma.bug.findUnique({
                where: { id: bugId }
            });

            if (!bug) {
                return res.status(404).json({ error: `Bug ${bugId} not found` });
            }

            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: user_id },
                select: { id: true, name: true, givenName: true, familyName: true }
            });

            if (!user) {
                return res.status(404).json({ error: `User ${user_id} not found` });
            }

            const authorName = user.givenName && user.familyName
                ? `${user.givenName} ${user.familyName}`.trim()
                : user.name || 'Unknown';

            // Create comment
            const comment = await prisma.comment.create({
                data: {
                    bugId,
                    text,
                    author: user_id,
                    authorName
                }
            });

            // Update bug's lastUpdated
            await prisma.bug.update({
                where: { id: bugId },
                data: { lastUpdated: new Date() }
            });

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
    hasAnyRole,
    validate(bugCommentSearchSchema, 'params'),
    async (req, res) => {
        try {
            const { bugId, commentId } = req.params;

            debugGet(`Fetching comment ${commentId} from bug ${bugId}`);

            const comment = await prisma.comment.findFirst({
                where: {
                    id: commentId,
                    bugId: bugId
                }
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
router.get('/:bugId/comments', isAuthenticated,hasPermissions('canViewData'), hasAnyRole, validate(bugIdSchema, 'params'), async (req, res) => {
    try {
        const { bugId } = req.params;

        debugGet(`Fetching all comments from bug: ${bugId}`);

        const comments = await prisma.comment.findMany({
            where: { bugId },
            orderBy: { createdAt: 'asc' }
        });

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