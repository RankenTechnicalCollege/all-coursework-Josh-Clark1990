import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import debug from 'debug';
import { mpgRouter } from './api/mpg/calc.js';
import { tempRouter } from './api/temperature/convert.js';
import { interestRouter } from './api/interest/calc.js';
import { incomeTaxRouter } from './api/income-tax/calc.js';

const debugServer = debug('app:server');

const app = express();
const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  debugServer(`Server is running on http://localhost:${PORT}`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('hot1/dist'));
app.use('api/mpg', mpgRouter);
app.use('api/temp', tempRouter);
app.use('api/interest', interestRouter);
app.use('api/income-tax', incomeTaxRouter);

