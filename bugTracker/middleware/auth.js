import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// import { mongodbAdapter } from 'better-auth/adapters/mongodb';
// import { MongoClient } from 'mongodb';
// import { mongodbAdapter } from 'better-auth/adapters/mongodb';
// import { betterAuth } from 'better-auth';

// const client = new MongoClient(process.env.MONGODB_URI);
// const db = client.db(process.env.MONGO_DB_NAME);

// // export const auth = betterAuth({
// //   emailAndPassword: {
// //     enabled: true,
// //     secret : process.env.BETTER_AUTH_SECRET,
// //     tokenExpiresIn : 60 * 60 * 1000 //1 hour
// //   }
      // database: mongodbAdapter({
      //   uri: process.env.MONGODB_URI,
      //   dbName: process.env.MONGO_DB_NAME,
      //client
      // })
// // });

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