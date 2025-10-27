import express from 'express';
import { PrismaClient } from '@prisma/client';
import debug from 'debug';
import { validate } from '../../middleware/validator.js';
import { testIdSchema, testUpdateSchema, testUserSchema } from '../../validation/testSchema.js';
import { bugIdSchema } from '../../validation/bugSchema.js';

const prisma = new PrismaClient();

const debugPost = debug('test:post');
const debugGet = debug('test:get');
const debugUpdate = debug('test:update');
const debugDelete = debug('test:delete');

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
            const { bugId } = req.params;
            const { title, description, status, author_id } = req.body;

            debugPost(`Creating test case for bug: ${bugId}`);

            // Check if bug exists
            const bug = await prisma.bug.findUnique({
                where: { id: bugId }
            });

            if (!bug) {
                return res.status(404).json({ error: 'Bug not found' });
            }

            // Check if user exists and is a quality analyst
            const user = await prisma.user.findUnique({
                where: { id: author_id },
                select: { id: true, name: true, givenName: true, familyName: true, role: true }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.role !== 'quality analyst') {
                return res
                    .status(403)
                    .json({ error: 'User must be a quality analyst to add test cases' });
            }

            const authorName = user.givenName && user.familyName
                ? `${user.givenName} ${user.familyName}`.trim()
                : user.name || 'Unknown';

            // Create test case
            const testCase = await prisma.testCase.create({
                data: {
                    bugId,
                    title,
                    description,
                    status,
                    author: author_id,
                    authorName
                }
            });

            // Update bug's lastUpdated
            await prisma.bug.update({
                where: { id: bugId },
                data: { lastUpdated: new Date() }
            });

            debugPost(`Test case created successfully for bug: ${bugId}`);

            res.status(200).json({ message: 'Test case added', testCase });
        } catch (err) {
            debugPost('Error creating test case', err);
            res.status(500).json({ error: 'Failed to create test case', details: err.message });
        }
    }
);

// -----------------------------------------------------------------------------
// Get all test cases from a bug
// -----------------------------------------------------------------------------
router.get('/:bugId/tests', validate(bugIdSchema, 'params'), async (req, res) => {
    try {
        const { bugId } = req.params;

        debugGet(`Fetching all test cases for bug: ${bugId}`);

        // Check if bug exists
        const bug = await prisma.bug.findUnique({
            where: { id: bugId }
        });

        if (!bug) {
            return res.status(404).json({ error: 'Bug not found' });
        }

        const testCases = await prisma.testCase.findMany({
            where: { bugId },
            orderBy: { createdAt: 'desc' }
        });

        if (!testCases || testCases.length === 0) {
            return res.status(200).json({ message: 'No test cases found on this bug', testCases: [] });
        }

        res.status(200).json(testCases);
    } catch (err) {
        console.error('Error fetching test cases:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// -----------------------------------------------------------------------------
// Get a specific test case from a bug
// -----------------------------------------------------------------------------
router.get('/:bugId/tests/:testId', validate(testIdSchema, 'params'), async (req, res) => {
    try {
        const { bugId, testId } = req.params;

        debugGet(`Fetching test case ${testId} from bug ${bugId}`);

        const testCase = await prisma.testCase.findFirst({
            where: {
                id: testId,
                bugId: bugId
            }
        });

        if (!testCase) {
            return res.status(404).json({ error: 'Test case not found' });
        }

        res.status(200).json(testCase);
    } catch (err) {
        console.error('Error fetching test case:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// -----------------------------------------------------------------------------
// Edit a test case for a bug
// -----------------------------------------------------------------------------
router.patch(
    '/:bugId/tests/:testId',
    validate(testIdSchema, 'params'),
    validate(testUpdateSchema, 'body'),
    async (req, res) => {
        try {
            const { bugId, testId } = req.params;
            const updates = req.body || {};

            debugUpdate(`Updating test case ${testId} for bug ${bugId}`);

            // Check if test case exists
            const existingTest = await prisma.testCase.findFirst({
                where: {
                    id: testId,
                    bugId: bugId
                }
            });

            if (!existingTest) {
                return res.status(404).json({ error: 'Test case not found' });
            }

            // Update test case
            const updatedTest = await prisma.testCase.update({
                where: { id: testId },
                data: updates
            });

            // Update bug's lastUpdated
            await prisma.bug.update({
                where: { id: bugId },
                data: { lastUpdated: new Date() }
            });

            res.status(200).json({
                message: 'Test case updated successfully',
                testCase: updatedTest
            });
        } catch (err) {
            console.error('Update test case error', err);
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
);

// -----------------------------------------------------------------------------
// Delete a test case from a bug
// -----------------------------------------------------------------------------
router.delete('/:bugId/tests/:testId', validate(testIdSchema, 'params'), async (req, res) => {
    try {
        const { bugId, testId } = req.params;

        debugDelete(`Attempting to delete test id: ${testId}`);

        // Check if test case exists
        const testCase = await prisma.testCase.findFirst({
            where: {
                id: testId,
                bugId: bugId
            }
        });

        if (!testCase) {
            return res.status(404).json({ error: 'Test case not found' });
        }

        // Delete test case
        await prisma.testCase.delete({
            where: { id: testId }
        });

        // Update bug's lastUpdated
        await prisma.bug.update({
            where: { id: bugId },
            data: { lastUpdated: new Date() }
        });

        return res.status(200).json({
            message: 'Test case deleted successfully',
            deletedId: testId
        });
    } catch (err) {
        console.error('Delete test case error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

export { router as testRouter };