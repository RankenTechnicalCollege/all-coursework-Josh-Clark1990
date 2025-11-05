import express from 'express';
import debug from 'debug';
import { productsRouter } from './routes/api/products.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/api/auth.js';
import { usersRouter } from './routes/api/users.js';
import cors from 'cors';
import { auth } from './middleware/auth.js';
import { toNodeHandler } from 'better-auth/node';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], 
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Better-auth routes
app.use('/api/auth', toNodeHandler(auth));

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 2023;
const HOST = 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  debug(`Server is running at http://${HOST}:${PORT}`);
  console.log(`Server is running at http://${HOST}:${PORT}`);
});