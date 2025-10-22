// server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { usersRouter } from './routes/api/users.js';
import { bugsRouter } from './routes/api/bugs.js';
import { commentsRouter } from './routes/api/comments.js';
import { testRouter } from './routes/api/test.js';
import dotenv from 'dotenv';

dotenv.config();

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
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Server running on port ${PORT}`);

    try {
        const db = await connectToDatabase();
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err);
    }
});
import { connectToDatabase } from './database.js';

