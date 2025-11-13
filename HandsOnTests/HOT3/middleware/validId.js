import { ObjectId } from 'mongodb';

export const validId = (req, res, next) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}; 