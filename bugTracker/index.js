import express from 'express';
import cors from 'cors';


// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('frontend/dist'));

// Route handlers
app.use('/api/users', (await import('./routes/api/users.js')).usersRouter);
app.use('/api/bugs', (await import('./routes/api/bugs.js')).bugsRouter);
app.use('/api/bugs', (await import('./routes/api/comments.js')).commentsRouter);



// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})