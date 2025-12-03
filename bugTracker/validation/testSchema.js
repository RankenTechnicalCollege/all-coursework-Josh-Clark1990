import { z } from 'zod';

const testUserSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(3).max(100),
    status: z.enum(['passed', 'failed', 'pending']),
    author_id: z.string().length(24).regex(/^[0-9a-f]{24}$/i, 'Must be a valid MongoDB ObjectId')
});

const testIdSchema = z.object({
    testId: z.string().length(24).regex(/^[0-9a-f]{24}$/i, 'Must be a valid MongoDB ObjectId'),
    bugId: z.string().length(24).regex(/^[0-9a-f]{24}$/i, 'Must be a valid MongoDB ObjectId')
});

const testUpdateSchema = z.object({
    title: z.string().optional(),
    description: z.string().min(3).max(100).optional(),
    status: z.enum(['passed', 'failed', 'pending']).optional(),
    author_id: z.string().length(24).regex(/^[0-9a-f]{24}$/i, 'Must be a valid MongoDB ObjectId').optional()
});

export { testUserSchema, testIdSchema, testUpdateSchema };