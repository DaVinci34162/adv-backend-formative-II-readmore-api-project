const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Published year seems unrealistic'],
      max: [new Date().getFullYear(), 'Published year cannot be in the future'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Book must reference an author'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);