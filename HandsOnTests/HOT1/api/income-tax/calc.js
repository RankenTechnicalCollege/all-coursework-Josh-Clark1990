import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';

dotenv.config();
const debugTax = debug('app:calc');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the Income Tax Calculation API');
});

// Pick mode (single or married)
const mode = (req, res) => {
  const mode = req.body.mode?.toLowerCase();
  const validModes = ['single', 'married'];
  if (!validModes.includes(mode)) {
    res.status(400).json({ error: 'Invalid mode. Use "single" or "married".' });
    return null;
  } else {
    return mode;
  }
};

// Validate income
const incomeAmount = (req, res) => {
  const income = parseFloat(req.body.income);
  if (isNaN(income) || income < 0) {
    res.status(400).json({ error: 'Invalid income value' });
    return null;
  } else {
    return income;
  }
};

// Tax calculation for single filers
const singleTax = (income) => {
  if (income <= 11925) return income * 0.10;
  else if (income <= 48475) return 1192.50 + 0.12 * (income - 11925);
  else if (income <= 103350) return 5578.50 + 0.22 * (income - 48475);
  else if (income <= 197300) return 17651 + 0.24 * (income - 103350);
  else if (income <= 250525) return 40199 + 0.32 * (income - 197300);
  else if (income <= 626350) return 57231 + 0.35 * (income - 250525);
  else return 188769.75 + 0.37 * (income - 626350);
};

// Tax calculation for married filers
const marriedTax = (income) => {
  if (income <= 23850) return income * 0.10;
  else if (income <= 96950) return 2385 + 0.12 * (income - 23850);
  else if (income <= 206700) return 11157 + 0.22 * (income - 96950);
  else if (income <= 394600) return 35302 + 0.24 * (income - 206700);
  else if (income <= 501050) return 80398 + 0.32 * (income - 394600);
  else if (income <= 751600) return 114462 + 0.35 * (income - 501050);
  else return 202154.50 + 0.37 * (income - 751600);
};

// Unified endpoint that calculates tax based on mode and income
router.post('/calculate', (req, res) => {
  const filingMode = mode(req, res);
  const income = incomeAmount(req, res);

  if (filingMode !== null && income !== null) {
    let taxOwed;
    if (filingMode === 'single') {
      taxOwed = singleTax(income);
    } else if (filingMode === 'married') {
      taxOwed = marriedTax(income);
    }
    res.json({
      mode: filingMode,
      income: income,
      taxOwed: taxOwed.toFixed(2),
    });
  }
});

export { router as incomeTaxRouter };
