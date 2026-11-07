
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

// Absolute path ensures reliability across different working directories and environments
const DB_PATH = path.join(__dirname, "books.db");

async function connectDB() {
    try {
        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        // Ensure table exists while preserving existing records and auto-increment state
        await db.exec(`
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price REAL NOT NULL
            )
        `);

        console.log(`Database connected successfully (${DB_PATH})`);
        return db;
    } catch (error) {
        console.error("Database connection error:", error.message);
        throw error;
    }
}

module.exports = connectDB;

