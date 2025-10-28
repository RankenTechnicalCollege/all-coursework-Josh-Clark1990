import Joi from 'joi';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string()
        .valid(
            'developer',
            'business analyst',
            'quality analyst',
            'product manager',
            'technical manager',
            'user'
        )
        .required(),
    fullName: Joi.string().required(),
    givenName: Joi.string().required(),
    familyName: Joi.string().required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required() 
});

const userIdSchema = Joi.object({
    id: Joi.string().uuid().required() 
});

const userUpdateSchema = Joi.object({
    password: Joi.string().min(6).max(20).optional(), 
    confirmPassword: Joi.any()
        .valid(Joi.ref('password'))
        .when('password', {
            is: Joi.exist(),
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    fullName: Joi.string().optional(),
    givenName: Joi.string().optional(),
    familyName: Joi.string().optional(),
    role: Joi.string().forbidden().optional()
});

export { registerSchema, loginSchema, userIdSchema, userUpdateSchema };