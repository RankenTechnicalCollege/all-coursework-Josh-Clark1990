import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';

dotenv.config();
const debugInterest = debug('app:calc');
const router = express.Router();

// Middleware to parse JSON body
router.use(express.json());

router.get('/', (req, res) => {
  res.send('Welcome to the Interest Calculation API');
});

router.post('/calculate', (req, res) => {
  const { principal, interestRate, years } = req.body;

  // Parse values
  const p = parseFloat(principal);
  const r = parseFloat(interestRate);
  const y = parseFloat(years);

  // Validate principal
  if (isNaN(p) || p <= 0) {
    return res.status(400).json({ error: 'Invalid principal: must be a number greater than 0.' });
  }

  // Validate interest rate
  if (isNaN(r) || r <= 0 || r > 100) {
    return res.status(400).json({ error: 'Invalid interestRate: must be a number between 0 and 100.' });
  }

  // Validate years
  if (isNaN(y) || y <= 0 || y > 50) {
    return res.status(400).json({ error: 'Invalid years: must be a number greater than 0 and less than or equal to 50.' });
  }

  // Calculation
  const finalAmount = p * ((1 + r / 100 / 12) ** (y * 12));
  const roundedFinal = finalAmount.toFixed(2);

  // Log result
  debugInterest(`Calculated Final Amount: ${roundedFinal}`);

  // Send response
  res.json({ finalAmount: roundedFinal });
});

export { router as interestRouter };
