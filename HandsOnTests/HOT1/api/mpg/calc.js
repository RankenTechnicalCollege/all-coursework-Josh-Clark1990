import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';

dotenv.config();
const debugCalc = debug('app:calc');
const router = express.Router();

router.post('/', (req, res) => {
  res.send('Welcome to the MPG Calculator API');
});

// Validate miles driven
const milesDriven = (req, res) => {
  const milesDriven = parseFloat(req.body.milesDriven);
  if (isNaN(milesDriven) || milesDriven < 0) {
    res.status(400).json({ error: 'Invalid miles value' });
    return null;
  } else {
    return milesDriven;
  }
};

// Validate gallons used
const gallonsUsed = (req, res) => {
  const gallonsUsed = parseFloat(req.body.gallonsUsed);
  if (isNaN(gallonsUsed) || gallonsUsed <= 0) {
    res.status(400).json({ error: 'Invalid gallons value' });
    return null;
  } else {
    return gallonsUsed;
  }
};

// Calculate MPG
const averageMpg = (milesDriven, gallonsUsed) => {
  return (milesDriven / gallonsUsed).toFixed(2);
};

// POST endpoint to calculate MPG
router.post('/calculate', (req, res) => {
  const miles = milesDriven(req, res);
  const gallons = gallonsUsed(req, res);

  if (miles !== null && gallons !== null) {
    const mpg = averageMpg(miles, gallons);
    res.json({ mpg: mpg });
  }
});

export { router as mpgRouter };
