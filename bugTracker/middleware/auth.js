import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticateToken(req, res, next) {
  try{
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue'});
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
} catch (err) {
  return res.status(401).json( {message: 'Invalid token, please log in again'});
}};