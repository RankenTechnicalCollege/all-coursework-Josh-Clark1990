import Joi from 'joi'

const testUserSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().min(3).max(100).required(),
  status: Joi.string().valid('passed', 'failed').required(),
  author_id: Joi.string().length(24).hex().required()

});

export { testUserSchema}