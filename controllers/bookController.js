const Book = require('../models/Book');
const Author = require('../models/Author');

// GET /books
// Supports dynamic filter (?genre=&author=&minPrice=&maxPrice=&inStock=)
// and sort (?sort=price&order=asc|desc)
exports.getBooks = async (req, res, next) => {
  try {
    const { genre, author, minPrice, maxPrice, inStock, sort, order } = req.query;

    const filter = {};
    if (genre) filter.genre = new RegExp(`^${genre}$`, 'i');
    if (author) filter.author = author;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (inStock === 'false') filter.stock = { $lte: 0 };

    // Dynamic sort
    let sortObj = { title: 1 };
    if (sort) {
      const direction = order === 'desc' ? -1 : 1;
      sortObj = { [sort]: direction };
    }

    const books = await Book.find(filter)
      .sort(sortObj)
      .populate('author', 'name nationality');

    res.json(books);
  } catch (err) {
    next(err);
  }
};

// GET /books/:id
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'author',
      'name nationality bio birthYear'
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

// POST /books
exports.createBook = async (req, res, next) => {
  try {
    const { title, isbn, genre, price, author, publishedYear, stock } = req.body;

    // Rule: author must exist
    if (!author) {
      return res.status(400).json({ message: 'Author id is required' });
    }
    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(422).json({ message: 'Referenced author does not exist' });
    }

    // Rule: price validation
    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Rule: duplicate ISBN -> 409
    const existing = await Book.findOne({ isbn });
    if (existing) {
      return res.status(409).json({ message: 'A book with this ISBN already exists' });
    }

    const book = await Book.create({
      title,
      isbn,
      genre,
      price,
      author,
      publishedYear,
      stock,
    });
    await book.populate('author', 'name nationality');
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

// PUT /books/:id
exports.updateBook = async (req, res, next) => {
  try {
    // If author is being changed, validate the new author exists
    if (req.body.author) {
      const authorExists = await Author.findById(req.body.author);
      if (!authorExists) {
        return res.status(422).json({ message: 'Referenced author does not exist' });
      }
    }

    // Duplicate ISBN check on update (if isbn is changing)
    if (req.body.isbn) {
      const conflict = await Book.findOne({
        isbn: req.body.isbn,
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({ message: 'A book with this ISBN already exists' });
      }
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('author', 'name nationality');

    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

// DELETE /books/:id
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /books/stats
// Aggregate: count, avg price, total stock, per-genre breakdown.
// Handles no-books case gracefully.
exports.getBookStats = async (req, res, next) => {
  try {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    const byGenre = await Book.aggregate([
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (!stats.length) {
      return res.json({
        totalBooks: 0,
        avgPrice: 0,
        totalStock: 0,
        minPrice: 0,
        maxPrice: 0,
        byGenre: [],
        message: 'No books in catalog yet',
      });
    }

    res.json({ ...stats[0], _id: undefined, byGenre });
  } catch (err) {
    next(err);
  }
};