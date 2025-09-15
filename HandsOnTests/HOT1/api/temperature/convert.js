import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';

dotenv.config();
const debugTemp = debug('app:convert');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Temperature Conversion API');
});

// Fahrenheit → Celsius
const FtoC = (req, res) => {
  const fahrenheit = parseFloat(req.body.fahrenheit);
  if (isNaN(fahrenheit)) {
    res.status(400).json({ error: 'Invalid Fahrenheit value' });
    return null;
  } else {
    return ((fahrenheit - 32) * 5 / 9).toFixed(2);
  }
};

// Celsius → Fahrenheit
const CtoF = (req, res) => {
  const celsius = parseFloat(req.body.celsius);
  if (isNaN(celsius)) {
    res.status(400).json({ error: 'Invalid Celsius value' });
    return null;
  } else {
    return ((celsius * 9 / 5) + 32).toFixed(2);
  }
};

// Unified endpoint that switches mode based on user input
router.post('/convert', (req, res) => {
  const { mode } = req.body; // "FtoC" or "CtoF"

  if (mode === 'FtoC') {
    const celsius = FtoC(req, res);
    if (celsius !== null) {
      res.json({ celsius: celsius });
    }
  } else if (mode === 'CtoF') {
    const fahrenheit = CtoF(req, res);
    if (fahrenheit !== null) {
      res.json({ fahrenheit: fahrenheit });
    }
  } else {
    res.status(400).json({ error: 'Invalid mode. Use "FtoC" or "CtoF".' });
  }
});

export { router as tempRouter };
