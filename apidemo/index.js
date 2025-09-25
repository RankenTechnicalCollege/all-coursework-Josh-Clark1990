import express from 'express';
import {ping} from './database.js';

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('frontend/dist'));

// Route handlers
app.use('/api/users', (await import('./routes/api/users.js')).usersRouter);
app.use('/api/bugs', (await import('./routes/api/bugs.js')).bugsRouter);

// Ping the database to ensure connection is established
try {
  await ping();
  console.log('Database ping successful');
} catch (err) {
  console.error('Database ping failed:', err.message);
}

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})