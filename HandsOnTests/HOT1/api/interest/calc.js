import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';
dotenv.config();
const debugInterest = debug('app:calc');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Interest Calculation API');
});





export { router as interestRouter }; 