const validate = (schema, property = 'body') => (req, res, next) => {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  };

  const { error, value } = schema.validate(req[property], options);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      type: 'ValidationFailed',
      message: 'Invalid data submitted. See details for errors',
      details: errorMessage
    });
  }

  req[property] = value;
  next();
};

export { validate };
