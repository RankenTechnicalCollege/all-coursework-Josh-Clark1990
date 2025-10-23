import express from 'express';
import { initAuth } from './middleware/auth.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  try {
    await initAuth();
    console.log('✅ Better Auth initialized and MongoDB connected');
  } catch (err) {
    console.error('❌ Failed to initialize auth or connect MongoDB:', err);
    process.exit(1); // stop server if auth cannot initialize
  }

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('frontend/dist'));
    app.use(cookieParser());

  const { usersRouter } = await import('./routes/api/users.js');
  const { bugsRouter } = await import('./routes/api/bugs.js');
  const { commentsRouter } = await import('./routes/api/comments.js');
  const { testRouter } = await import('./routes/api/test.js');



  // API routes
  app.use('/api/users', usersRouter);
  app.use('/api/bugs', bugsRouter);
  app.use('/api/bugs', commentsRouter);
  app.use('/api/bugs', testRouter);

  // Health check
  app.get('/', (req, res) => res.send('Bugtracker API running'));

  // Use Cloud Run port
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('❌ Server failed to start:', err);
});
