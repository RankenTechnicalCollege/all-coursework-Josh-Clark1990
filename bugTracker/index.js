import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { auth, mongoClient } from './middleware/auth.js';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { usersRouter } from './routes/api/users.js';
import { bugsRouter } from './routes/api/bugs.js';
import { commentsRouter } from './routes/api/comments.js';
import { testRouter } from './routes/api/test.js';
import { authRouter } from './routes/api/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://bugtracker-1019735204077.us-central1.run.app"
  ],
  credentials: true
}));

// Cookie parser
app.use(cookieParser());

app.use('/api/auth', authRouter);

// Better Auth routes
app.all('/api/auth/*', toNodeHandler(auth));

// Custom session check middleware
app.use(async (req, res, next) => {
  const token = req.cookies['better-auth.session_token'];
  if (token) {
    try {
      const session = await auth.api.getSession({
        headers: { Cookie: `better-auth.session_token=${token}` }
      });
      if (session?.user) {
        const sessionUser = session.user;
        const db = mongoClient.db();
        const user = await db.collection('user').findOne({ id: sessionUser.id });
        const userRoles = user?.role ? [user.role] : ['developer'];

        req.user = {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          userRoles
        };
        req.session = session;
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  next();
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/bugs', commentsRouter);
app.use('/api/bugs', testRouter);

// Health check
app.get('/', (req, res) => res.send('Bugtracker API running'));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n⚡ Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    console.log('Server closed');
    await mongoClient.close();
    console.log('MongoDB disconnected');
    process.exit(0);
  });

  setTimeout(() => {
    console.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});