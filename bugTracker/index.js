// server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { usersRouter } from './routes/api/users.js';
import { bugsRouter } from './routes/api/bugs.js';
import { commentsRouter } from './routes/api/comments.js';
import { testRouter } from './routes/api/test.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend/dist'));
app.use(cookieParser());


// API routes
app.use('/api/users', usersRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/bugs', commentsRouter);
app.use('/api/bugs', testRouter);

// Health check
app.get('/', (req, res) => res.send('Bugtracker API running'));

// Use Cloud Run port
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at: http://${HOST}:${PORT}`);
});

