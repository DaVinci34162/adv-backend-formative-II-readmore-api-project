require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'ReadMore API is running 📚',
    endpoints: {
      authors: '/authors',
      books: '/books',
      bookStats: '/books/stats',
      authorBooks: '/authors/:id/books',
    },
  });
});

app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});