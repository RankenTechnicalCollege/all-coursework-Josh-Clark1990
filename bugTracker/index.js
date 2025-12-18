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
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5000",
    "https://bugtracker-1019735204077.us-central1.run.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie parser
app.use(cookieParser());

// Better Auth routes - catches remaining /api/auth/* routes
app.all('/api/auth/*', toNodeHandler(auth));

// Custom session check middleware
app.use(async (req, res, next) => {
  // In production (HTTPS), Better Auth adds '__Secure-' prefix (two underscores, capital S)
  const cookieName = process.env.NODE_ENV === 'production' 
    ? '__Secure-better-auth.session_token'
    : 'better-auth.session_token';
    
  const token = req.cookies[cookieName];
  
  if (token) {
    try {
      const session = await auth.api.getSession({
        headers: { Cookie: `${cookieName}=${token}` }
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
          role: user?.role || 'developer',
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

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontEnd/dist')));

// Handle React routing - catch-all LAST
app.get('*', (req, res, next) => {
  // Skip if path has a file extension (like .js, .css, .png)
  if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'frontEnd/dist', 'index.html'));
});

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