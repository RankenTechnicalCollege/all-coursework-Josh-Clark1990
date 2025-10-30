import joi from 'joi';

const productCreateSchema = joi.object({
  name: joi.string().min(1).max(100).required(),
  description: joi.string().max(500).required(),
  price: joi.number().positive().required(),
  category: joi.string().required(),
});

const productIdSchema = joi.object({
  id: joi.string().hex().length(24).required(),
});

const productUpdateSchema = joi.object({
  name: joi.string().min(1).max(100).optional(),
  description: joi.string().max(500).optional(),
  price: joi.number().positive().optional(),
  category: joi.string().optional(),
});

const productNameSchema = joi.object({
  name: joi.string().min(1).max(100).required(),
});

export { productCreateSchema, productIdSchema, productUpdateSchema, productNameSchema };