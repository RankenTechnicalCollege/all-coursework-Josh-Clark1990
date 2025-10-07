import Joi from 'joi'

const bugCreateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  stepsToReproduce: Joi.string().required(),
  authorOfBug: Joi.string().required()
});

const bugIdSchema = Joi.object({
  bugId: Joi.string().length(24).hex().required()
});

const bugUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  stepsToReproduce: Joi.string().optional()
});

const bugClassifySchema = Joi.object({
  classification: Joi.string().valid('approved', 'unapproved', 'duplicate').required()
});

const bugAssignSchema = Joi.object({
  user_id: Joi.string().length(24).hex().required()
});

const bugCloseSchema = Joi.object({
  status: Joi.boolean().valid(true, false).required()
});

const bugCommentSchema = Joi.object({
  user_id: Joi.string().length(24).hex().required(),
  text: Joi.string().required()
});


const bugCommentSearchSchema = Joi.object({
  bugId: Joi.string().length(24).hex().required(),
  commentId: Joi.string().length(24).hex().required()
});


export {bugCreateSchema, bugIdSchema, bugUpdateSchema, bugClassifySchema, bugAssignSchema, bugCloseSchema, bugCommentSchema, bugCommentSearchSchema};