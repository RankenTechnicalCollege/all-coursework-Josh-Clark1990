import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import { validate } from '../../middleware/validator.js';
import { testIdSchema, testUpdateSchema, testUserSchema } from '../../validation/testSchema.js';
import { bugIdSchema } from '../../validation/bugSchema.js';

const debugPost = debug('test:post');
const debugDelete = debug('bugs:delete');

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
                return res
                    .status(403)
                    .json({ error: 'User must be a quality analyst to add test cases' });
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
router.get('/:bugId/tests', validate(bugIdSchema, 'params'), async (req, res) => {
    try {
        const db = await getDb();
        const { bugId } = req.params;

        if (!ObjectId.isValid(bugId))
            return res.status(404).json({ error: 'Invalid bug id' });

        const bug = await db
            .collection('Bugs')
            .findOne({ _id: new ObjectId(bugId) }, { projection: { testCases: 1 } });

        if (!bug) return res.status(404).json({ error: 'Bug not found' });

        if (!bug.testCases || bug.testCases.length === 0) {
            return res.status(200).json({ message: 'No test cases found on this bug' });
        }

        res.status(200).json(bug.testCases);
    } catch (err) {
        console.error('Error fetching bug:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// -----------------------------------------------------------------------------
// Get a specific test case from a bug
// -----------------------------------------------------------------------------
router.get('/:bugId/tests/:testId', validate(testIdSchema, 'params'), async (req, res) => {
    try {
        const db = await getDb();
        const { bugId, testId } = req.params;

        if (!ObjectId.isValid(bugId) || !ObjectId.isValid(testId))
            return res.status(404).json({ error: 'Invalid bug/test id' });

        const bug = await db
            .collection('Bugs')
            .findOne({ _id: new ObjectId(bugId) }, { projection: { testCases: 1 } });

        if (!bug || !bug.testCases || bug.testCases.length === 0) {
            return res.status(404).json({ error: 'Test case not found' });
        }

        const test = bug.testCases.find((t) => t._id.toString() === testId);

        if (!test) return res.status(404).json({ error: 'Test case not found' });

        res.status(200).json(test);
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
            const db = await getDb();
            const { bugId, testId } = req.params;
            const updates = req.body || {};

            if (!ObjectId.isValid(bugId) || !ObjectId.isValid(testId)) {
                return res.status(400).json({ error: 'Invalid bug or test ID' });
            }

            const setFields = {};
            for (const key of ['title', 'description', 'status', 'author_id']) {
                if (updates[key] !== undefined) {
                    setFields[`testCases.$.${key}`] = updates[key];
                }
            }
            setFields['testCases.$.lastUpdated'] = new Date();

            const result = await db.collection('Bugs').updateOne(
                { _id: new ObjectId(bugId), 'testCases._id': new ObjectId(testId) },
                { $set: setFields }
            );

            if (!result.matchedCount) {
                return res.status(404).json({ error: 'Test case not found' });
            }

            res.status(200).json({
                message: 'Test case updated successfully',
                lastUpdated: setFields['testCases.$.lastUpdated']
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
router.delete('/:bugId/tests/:testId', validate(testIdSchema), async (req, res) => {
    try {
        const db = await getDb();
        const { bugId, testId } = req.params;

        debugDelete(`Attempting to delete test id: ${testId}`);

        if (!ObjectId.isValid(bugId) || !ObjectId.isValid(testId)) {
            return res.status(400).json({ error: 'Invalid bug or test id entered' });
        }

        const pullResult = await db.collection('Bugs').updateOne(
            { _id: new ObjectId(bugId) },
            { $pull: { testCases: { _id: new ObjectId(testId) } } }
        );

        if (pullResult.modifiedCount === 0) {
            return res.status(404).json({ error: 'Test Id not found' });
        }

        const bugDoc = await db
            .collection('Bugs')
            .findOne({ _id: new ObjectId(bugId) }, { projection: { testCases: 1 } });

        if (bugDoc?.testCases?.length === 0) {
            await db
                .collection('Bugs')
                .updateOne({ _id: new ObjectId(bugId) }, { $unset: { testCases: '' } });
        }

        return res.status(200).json({
            message: 'Test case deleted successfully',
            deletedId: testId
        });
    } catch (err) {
        console.error('Delete test case error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export { router as testRouter };
