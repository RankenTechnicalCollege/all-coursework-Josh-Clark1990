import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { auth } from './middleware/auth.js';
import { toNodeHandler } from 'better-auth/node'; 

// Static imports for routers
import { authRouter } from './routes/api/auth.js'
import { usersRouter } from './routes/api/users.js';
import { bugsRouter } from './routes/api/bugs.js';
import { commentsRouter } from './routes/api/comments.js';
import { testRouter } from './routes/api/test.js';

dotenv.config();

import express from 'express'; 

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: ["http://localhost:5000", "http://localhost:8080", "https://bugtracker-1019735204077.us-central1.run.app" ],
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.static('frontend/dist'));
  app.all('/api/betterAuth/splat', toNodeHandler(auth));

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/bugs', bugsRouter);
  app.use('/api/bugs', commentsRouter);
  app.use('/api/bugs', testRouter);

  // Health check
  app.get('/', (req, res) => res.send('Bugtracker API running'));

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });