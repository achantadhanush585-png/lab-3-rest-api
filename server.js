const express = require("express");
const connectDB = require("./database");
const booksRouter = require("./books");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Root endpoint: API Overview
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Book Management REST API is running",
        version: "1.0.0",
        author: "Dhanush Achanta",
        endpoints: {
            books: "/books",
            about: "/about",
            health: "/health"
        }
    });
});

// Student Metadata Endpoint
app.get("/about", (req, res) => {
    res.status(200).json({
        name: "Dhanush Achanta",
        registrationNumber: "252U1R5085",
        section: "CSE AIDE-2A-106",
        subject: "Backend Development Fundamentals",
        lab: "Lab 3 – REST API, Query Parameters, Validation and Debugging",
        institution: "Aurora Deemed to be University"
    });
});

// Health check endpoint for monitoring & deployment
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

async function startServer() {
    try {
        const db = await connectDB();
        app.locals.db = db;

        // Mount Books Router
        app.use("/books", booksRouter);

        // Catch-all 404 Handler for undefined routes
        app.use((req, res) => {
            res.status(404).json({
                message: "Route not found. Please check the URL and HTTP method."
            });
        });

        // Global Error Handling Middleware
        app.use((err, req, res, next) => {
            console.error("Unhandled server error:", err);
            res.status(500).json({
                message: "Internal server error"
            });
        });

        // Listen on configured port with dynamic port conflict fallback
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API base URL: http://localhost:${PORT}/books`);
        });

        server.on("error", (err) => {
            if (err.code === "EACCES" || err.code === "EADDRINUSE") {
                console.warn(`Port ${PORT} is restricted or already in use. Retrying on port 3001...`);
                app.listen(3001, () => {
                    console.log(`Server running on fallback port 3001`);
                    console.log(`API base URL: http://localhost:3001/books`);
                });
            } else {
                console.error("Server startup error:", err);
            }
        });

    } catch (error) {
        console.error("Server initialization failed:", error.message);
        process.exit(1);
    }
}

startServer();
