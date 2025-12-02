import { z } from 'zod';
// Remove: import Joi from 'joi';

const bugCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    stepsToReproduce: z.string().min(1),
});

const bugIdSchema = z.object({
    bugId: z.string().min(1)
});

const bugUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  stepsToReproduce: z.string().optional(),
  statusLabel: z.enum(['open', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
  classification: z.string().optional(),
});

const bugClassifySchema = z.object({
    classification: z.enum(['approved', 'unapproved', 'duplicate'])
});

const bugAssignSchema = z.object({
    user_id: z.string().min(1)
});

const bugCloseSchema = z.object({
    status: z.boolean()
});

const bugCommentSchema = z.object({
    user_id: z.string().min(1),
    text: z.string().min(1)
});

const bugCommentSearchSchema = z.object({
    bugId: z.string().min(1),
    commentId: z.string().min(1)
});

export {
    bugCreateSchema,
    bugIdSchema,
    bugUpdateSchema,
    bugClassifySchema,
    bugAssignSchema,
    bugCloseSchema,
    bugCommentSchema,
    bugCommentSearchSchema
};