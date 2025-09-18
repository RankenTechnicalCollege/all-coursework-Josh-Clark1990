import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';

dotenv.config();
const debugTemp = debug('app:convert');
const router = express.Router();

router.post('/', (req, res) => {
  res.send('Welcome to the Temperature Conversion API');
});


router.post('/convert', (req, res) => {
  const temp = parseFloat(req.body.temp);
  if (isNaN(temp)) {
    return res.status(400).json({ error: 'Invalid temperature value' });
  }

  const mode = req.body.mode;
  const validModes = ['FtoC', 'CtoF'];

  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use "FtoC" or "CtoF".' });
  }

  let convertedTemp;

  if (mode === 'FtoC') {
    convertedTemp = ((temp - 32) * 5 / 9).toFixed(2);
    res.json({ celsius: convertedTemp });
  } else if (mode === 'CtoF') {
    convertedTemp = ((temp * 9 / 5) + 32).toFixed(2);
    res.json({ fahrenheit: convertedTemp });
  }

  debugTemp(`Converted temperature is ${convertedTemp}`);
});

export { router as tempRouter };
