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

app.use(express.json());
app.use(cookieParser);
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Better-auth routes using proper Node handler - MOVED BEFORE session middleware
app.use('/api/auth', toNodeHandler(auth));


// Add session middleware to attach user to req
app.use(async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session) {
      req.user = session.user;
    }
  } catch (error) {
    // No session, continue without user
  }
  next();
});

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 2023;
const HOST = 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  debug(`Server is running at http://${HOST}:${PORT}`);
  console.log(`Server is running at http://${HOST}:${PORT}`);
});