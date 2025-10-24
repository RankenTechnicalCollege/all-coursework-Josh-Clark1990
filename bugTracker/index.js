import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initAuth } from './middleware/auth.js';

// Static imports for routers
import { usersRouter } from './routes/api/users.js';
import { bugsRouter } from './routes/api/bugs.js';
import { commentsRouter } from './routes/api/comments.js';
import { testRouter } from './routes/api/test.js';

dotenv.config();

import express from 'express'; // Only once at top level

async function startServer() {
  try {
    // Initialize BetterAuth + MongoDB first
    await initAuth();
    console.log('✅ Better Auth initialized and MongoDB connected');
  } catch (err) {
    console.error('❌ Failed to initialize auth or connect MongoDB:', err);
    process.exit(1);
  }

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(cookieParser());
  app.use(express.static('frontend/dist'));

  // API routes
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
}

// Start the server
startServer().catch(err => {
  console.error('❌ Server failed to start:', err);
});