const validate = (schema, property = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[property]);

  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return res.status(400).json({
      status: 'error',
      type: 'ValidationFailed',
      message: 'Invalid data submitted. See details for errors',
      details: errorMessage
    });
  }

  req[property] = result.data;
  next();
};

export { validate };