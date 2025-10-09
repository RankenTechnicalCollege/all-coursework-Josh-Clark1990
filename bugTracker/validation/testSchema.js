import Joi from 'joi';

const testUserSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().min(3).max(100).required(),
    status: Joi.string().valid('passed', 'failed').required(),
    author_id: Joi.string().length(24).hex().required()
});

const testIdSchema = Joi.object({
    testId: Joi.string().length(24).hex().required(),
    bugId: Joi.string().length(24).hex().required()
});

const testUpdateSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().min(3).max(100).optional(),
    status: Joi.string().valid('passed', 'failed').optional(),
    author_id: Joi.string().length(24).hex().optional()
});

export { testUserSchema, testIdSchema, testUpdateSchema };
