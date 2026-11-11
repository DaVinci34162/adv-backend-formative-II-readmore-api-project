const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    nationality: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    birthYear: {
      type: Number,
      min: [1000, 'Birth year seems unrealistic'],
      max: [new Date().getFullYear(), 'Birth year cannot be in the future'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Author', authorSchema);