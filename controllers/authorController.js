const Author = require('../models/Author');
const Book = require('../models/Book');

// POST /authors
exports.createAuthor = async (req, res, next) => {
  try {
    const { name, bio, nationality, birthYear } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Author name is required' });
    }
    const author = await Author.create({ name, bio, nationality, birthYear });
    res.status(201).json(author);
  } catch (err) {
    next(err);
  }
};

// GET /authors
exports.getAuthors = async (req, res, next) => {
  try {
    const authors = await Author.find().sort({ name: 1 });
    res.json(authors);
  } catch (err) {
    next(err);
  }
};

// GET /authors/:id
exports.getAuthorById = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (err) {
    next(err);
  }
};

// PUT /authors/:id
exports.updateAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (err) {
    next(err);
  }
};

// DELETE /authors/:id
// Business rule justification (see Part 4 below):
// We use RESTRICT semantics - refuse to delete authors who still have books.
exports.deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });

    const bookCount = await Book.countDocuments({ author: author._id });
    if (bookCount > 0) {
      return res.status(409).json({
        message: `Cannot delete author. ${bookCount} book(s) are still associated. Reassign or delete them first.`,
      });
    }

    await author.deleteOne();
    res.json({ message: 'Author deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /authors/:id/books  (population demo — related entity)
exports.getBooksByAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });

    const books = await Book.find({ author: author._id }).populate(
      'author',
      'name nationality bio'
    );
    res.json({ author, books });
  } catch (err) {
    next(err);
  }
};