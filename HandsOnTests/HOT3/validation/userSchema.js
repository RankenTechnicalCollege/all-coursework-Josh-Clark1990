import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required()
});

const userIdSchema = Joi.object({
  id: Joi.string().required()
});

const userUpdateSchema = Joi.object({
  password: Joi.string().min(6).max(20).optional(),
  confirmPassword: Joi.string().valid(Joi.ref('password'))
  .when('password', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  fullName: Joi.string().optional()
});

export { registerSchema, loginSchema, userIdSchema, userUpdateSchema};