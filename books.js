const express = require("express");
const router = express.Router();

/**
 * GET /books
 * Supports:
 * - Query all books
 * - Search by title or author: ?search=keyword
 * - Price filtering: ?minPrice=100&maxPrice=500
 * - Sorting: ?sort=asc or ?sort=desc (default sort by price, or ?sortBy=title|author|price|id)
 * - Pagination: ?limit=2&page=1
 * - Combined queries: ?search=python&sort=asc&limit=5&page=1&minPrice=100&maxPrice=1000
 */
router.get("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { search, minPrice, maxPrice, sort, sortBy, page, limit } = req.query;

        const conditions = [];
        const params = [];

        // 1. Search filter (title or author)
        if (search !== undefined) {
            const trimmedSearch = String(search).trim();
            if (trimmedSearch.length > 0) {
                conditions.push("(LOWER(title) LIKE LOWER(?) OR LOWER(author) LIKE LOWER(?))");
                params.push(`%${trimmedSearch}%`, `%${trimmedSearch}%`);
            }
        }

        // 2. Minimum price filter
        let parsedMinPrice = null;
        if (minPrice !== undefined) {
            parsedMinPrice = Number(minPrice);
            if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
                return res.status(400).json({
                    message: "minPrice must be a valid non-negative number"
                });
            }
            conditions.push("price >= ?");
            params.push(parsedMinPrice);
        }

        // 3. Maximum price filter
        let parsedMaxPrice = null;
        if (maxPrice !== undefined) {
            parsedMaxPrice = Number(maxPrice);
            if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0) {
                return res.status(400).json({
                    message: "maxPrice must be a valid non-negative number"
                });
            }
            conditions.push("price <= ?");
            params.push(parsedMaxPrice);
        }

        // Validate minPrice <= maxPrice if both are provided
        if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMaxPrice < parsedMinPrice) {
            return res.status(400).json({
                message: "Maximum price cannot be lower than minimum price"
            });
        }

        // 4. Sorting validation and column whitelisting (Prevents SQL injection)
        const allowedSortColumns = ["id", "title", "author", "price"];
        let sortColumn = "id"; // Default sort column if no sort parameter is specified
        let sortDirection = "ASC";

        if (sortBy !== undefined) {
            const normalizedSortBy = String(sortBy).trim().toLowerCase();
            if (!allowedSortColumns.includes(normalizedSortBy)) {
                return res.status(400).json({
                    message: `Invalid sortBy column. Allowed columns: ${allowedSortColumns.join(", ")}`
                });
            }
            sortColumn = normalizedSortBy;
        }

        if (sort !== undefined) {
            const normalizedSort = String(sort).trim().toLowerCase();
            if (normalizedSort !== "asc" && normalizedSort !== "desc") {
                return res.status(400).json({
                    message: "Invalid sort parameter. Use 'asc' or 'desc'."
                });
            }
            sortDirection = normalizedSort.toUpperCase();
            // If sort direction is explicitly provided without sortBy, default sort column to 'price'
            if (sortBy === undefined) {
                sortColumn = "price";
            }
        }

        // 5. Pagination validation
        let isPaginationRequested = false;
        let pageNum = 1;
        let limitNum = 10;

        if (page !== undefined || limit !== undefined) {
            isPaginationRequested = true;

            if (page !== undefined) {
                pageNum = Number(page);
                if (!Number.isInteger(pageNum) || pageNum <= 0) {
                    return res.status(400).json({
                        message: "Page must be a positive integer"
                    });
                }
            }

            if (limit !== undefined) {
                limitNum = Number(limit);
                if (!Number.isInteger(limitNum) || limitNum <= 0) {
                    return res.status(400).json({
                        message: "Limit must be a positive integer"
                    });
                }
            }
        }

        // Build WHERE clause
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Query total count for metadata if pagination is requested or to report total
        const countQuery = `SELECT COUNT(*) AS total FROM books ${whereClause}`;
        const countResult = await db.get(countQuery, params);
        const total = countResult ? countResult.total : 0;

        // Build final SELECT query
        let sql = `SELECT * FROM books ${whereClause} ORDER BY ${sortColumn} ${sortDirection}`;
        const queryParams = [...params];

        if (isPaginationRequested) {
            const offset = (pageNum - 1) * limitNum;
            sql += " LIMIT ? OFFSET ?";
            queryParams.push(limitNum, offset);
        }

        const books = await db.all(sql, queryParams);

        // Friendly message for empty results
        const message = books.length === 0
            ? "No books found matching the search criteria"
            : "Books fetched successfully";

        if (isPaginationRequested) {
            return res.status(200).json({
                message,
                count: books.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum) || 1,
                data: books
            });
        }

        return res.status(200).json({
            message,
            count: books.length,
            data: books
        });

    } catch (error) {
        console.error("GET /books error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

/**
 * GET /books/:id
 * Fetches a single book by its primary key ID
 */
router.get("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid book ID. ID must be a positive integer"
            });
        }

        const book = await db.get("SELECT * FROM books WHERE id = ?", [id]);

        if (!book) {
            return res.status(404).json({
                message: `Book not found with ID ${id}`
            });
        }

        res.status(200).json({
            message: "Book fetched successfully",
            data: book
        });

    } catch (error) {
        console.error(`GET /books/${req.params.id} error:`, error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

/**
 * POST /books
 * Creates a new book record
 * Request body: { title: string, author: string, price: number }
 */
router.post("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { title, author, price } = req.body;

        // Check for missing fields
        if (title === undefined || author === undefined || price === undefined) {
            return res.status(400).json({
                message: "Missing required fields: title, author, and price are required"
            });
        }

        // Validate title
        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                message: "Title is required and must be a non-empty string"
            });
        }

        // Validate author
        if (typeof author !== "string" || author.trim().length === 0) {
            return res.status(400).json({
                message: "Author is required and must be a non-empty string"
            });
        }

        // Validate price data type
        if (typeof price !== "number" || !Number.isFinite(price)) {
            return res.status(400).json({
                message: "Price must be a valid number"
            });
        }

        // Validate price positive range
        if (price <= 0) {
            return res.status(400).json({
                message: "Price must be a positive number greater than 0"
            });
        }

        const trimmedTitle = title.trim();
        const trimmedAuthor = author.trim();

        const result = await db.run(
            "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
            [trimmedTitle, trimmedAuthor, price]
        );

        const newBook = await db.get("SELECT * FROM books WHERE id = ?", [result.lastID]);

        res.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID,
            data: newBook
        });

    } catch (error) {
        console.error("POST /books error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

/**
 * PUT /books/:id
 * Updates an existing book record
 * Request body: { title: string, author: string, price: number }
 */
router.put("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);
        const { title, author, price } = req.body;

        // Validate book ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid book ID. ID must be a positive integer"
            });
        }

        // Check if book exists
        const existingBook = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        if (!existingBook) {
            return res.status(404).json({
                message: `Book not found with ID ${id}`
            });
        }

        // Check for missing fields
        if (title === undefined || author === undefined || price === undefined) {
            return res.status(400).json({
                message: "Missing required fields: title, author, and price are required"
            });
        }

        // Validate title
        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                message: "Title is required and must be a non-empty string"
            });
        }

        // Validate author
        if (typeof author !== "string" || author.trim().length === 0) {
            return res.status(400).json({
                message: "Author is required and must be a non-empty string"
            });
        }

        // Validate price data type
        if (typeof price !== "number" || !Number.isFinite(price)) {
            return res.status(400).json({
                message: "Price must be a valid number"
            });
        }

        // Validate price positive range
        if (price <= 0) {
            return res.status(400).json({
                message: "Price must be a positive number greater than 0"
            });
        }

        const trimmedTitle = title.trim();
        const trimmedAuthor = author.trim();

        await db.run(
            "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
            [trimmedTitle, trimmedAuthor, price, id]
        );

        const updatedBook = await db.get("SELECT * FROM books WHERE id = ?", [id]);

        res.status(200).json({
            message: "Book updated successfully",
            data: updatedBook
        });

    } catch (error) {
        console.error(`PUT /books/${req.params.id} error:`, error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

/**
 * DELETE /books/:id
 * Deletes a book record by ID
 */
router.delete("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);

        // Validate book ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid book ID. ID must be a positive integer"
            });
        }

        // Check whether the record exists
        const existingBook = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        if (!existingBook) {
            return res.status(404).json({
                message: `Book not found with ID ${id}`
            });
        }

        // Delete the requested book
        await db.run("DELETE FROM books WHERE id = ?", [id]);

        res.status(200).json({
            message: "Book deleted successfully",
            deletedBook: existingBook
        });

    } catch (error) {
        console.error(`DELETE /books/${req.params.id} error:`, error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

module.exports = router;
