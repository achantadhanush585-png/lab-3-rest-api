# Backend Development Fundamentals – Lab 3: Book Management REST API

A production-grade, secure, and fully validated RESTful API for managing a book catalog, built with **Node.js**, **Express.js**, and an embedded **SQLite** database engine. This project implements complete CRUD operations, advanced query parameters (search, sorting, pagination, price range filtering, combined queries), strict input validation, security controls against SQL injection, and structured error responses.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives](#2-objectives)
3. [Technologies Used](#3-technologies-used)
4. [Project Structure](#4-project-structure)
5. [Installation & Setup](#5-installation--setup)
6. [How to Run the Server](#6-how-to-run-the-server)
7. [Database Architecture](#7-database-architecture)
8. [Complete API Endpoint Documentation](#8-complete-api-endpoint-documentation)
   - [A. System Endpoints](#a-system-endpoints)
   - [B. GET Endpoints](#b-get-endpoints)
   - [C. POST Endpoint](#c-post-endpoint)
   - [D. PUT Endpoint](#d-put-endpoint)
   - [E. DELETE Endpoint](#e-delete-endpoint)
9. [Query Parameters & Filtering Guide](#9-query-parameters--filtering-guide)
10. [Validation & Error Handling Rules](#10-validation--error-handling-rules)
11. [HTTP Status Codes Reference](#11-http-status-codes-reference)
12. [Debugging Exercises](#12-debugging-exercises)
13. [Testing Guide](#13-testing-guide)
    - [Automated Test Suite](#automated-test-suite)
    - [Postman Collection](#postman-collection)
    - [PowerShell / cURL Commands](#powershell--curl-commands)
14. [Screenshots Gallery](#14-screenshots-gallery)
15. [GitHub Preparation](#15-github-preparation)
16. [Deployment Guide (Render)](#16-deployment-guide-render)
17. [College Submission Checklist](#17-college-submission-checklist)
18. [Conclusion](#18-conclusion)

---

## 1. Project Overview

The **Book Management REST API** provides a backend service for cataloging, searching, and managing books. Designed specifically to adhere to second-year Computer Science backend curriculum standards, it emphasizes:
- **Clean Architecture:** Separation of routing (`books.js`), database initialization (`database.js`), and server bootstrap (`server.js`).
- **Data Integrity:** Strict parameter validation ensuring zero corrupted records or runtime type mismatches.
- **SQL Injection Prevention:** 100% parameterized queries for user values and strict whitelist validation for dynamic SQL clauses like `ORDER BY`.
- **Informative Error Handling:** Standardized JSON error responses with meaningful client-facing error messages while masking raw internal system stack traces.

---

## 2. Objectives

- Design and implement standard HTTP REST endpoints (`GET`, `POST`, `PUT`, `DELETE`).
- Support flexible querying: keyword searching across multiple fields, multi-directional sorting, offset-based pagination, and numeric boundary filtering.
- Implement robust defensive programming: handle missing fields, malformed types, negative pricing, non-existent identifiers, and invalid routing.
- Integrate an embedded SQLite database that guarantees persistence across restarts without losing auto-increment sequences or preexisting seed records.
- Provide end-to-end test verification through automated scripts and Postman collections.

---

## 3. Technologies Used

| Technology | Role | Version |
| :--- | :--- | :--- |
| **Node.js** | Server-side JavaScript runtime environment | v24+ / v18+ LTS |
| **Express.js** | Minimalist web application framework for HTTP routing and middleware | ^5.3.0 |
| **SQLite3** | Embedded, serverless relational database engine | ^6.0.1 |
| **sqlite** | Modern promise-based async/await wrapper for SQLite3 | ^5.1.1 |
| **Nodemon** | Development tool that automatically restarts the node application on file changes | ^3.1.14 |

---

## 4. Project Structure

```text
c:\lab 3 rest api\
│
├── server.js              # Application entry point, middleware setup, route mounting & global error handlers
├── database.js            # SQLite database connection pool and schema verification
├── books.js               # Books REST router implementing all CRUD endpoints & validation logic
├── package.json           # Project manifest, dependencies, and execution scripts
├── package-lock.json      # Dependency lockfile ensuring reproducible dependency tree
├── books.db               # Embedded SQLite database holding books records
├── test_suite.js          # Automated end-to-end unit & integration test runner (34 test cases)
├── capture_all_screenshots.js # Automated headless visual regression capture script
├── .gitignore             # Git exclusion rules for node_modules, logs, and sensitive files
├── README.md              # Comprehensive project documentation and lab report
│
├── postman/
│   └── Lab-3-REST-API.postman_collection.json # Complete Postman collection with test scripts
│
└── screenshots/           # Genuine visual verification captures
    ├── 01-server-started.png
    ├── 02-get-all-books.png
    ├── 03-get-book-by-id.png
    ├── 04-search-books.png
    ├── 05-sort-ascending.png
    ├── 06-sort-descending.png
    ├── 07-pagination.png
    ├── 08-price-filter.png
    ├── 09-post-success.png
    ├── 10-post-validation.png
    ├── 11-put-success.png
    ├── 12-put-validation.png
    ├── 13-delete-success.png
    ├── 14-delete-not-found.png
    ├── 15-invalid-route.png
    ├── 16-debugging-exercise-1.png
    └── 17-debugging-exercise-2.png
```

---

## 5. Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (Node Package Manager)

### Step 1: Open Terminal in Project Directory
```powershell
cd "c:\lab 3 rest api"
```

### Step 2: Install Dependencies
```powershell
npm install
```

---

## 6. How to Run the Server

### Production Mode
```powershell
npm start
```
*Executes `node server.js`.*

### Development Mode (with Live Reload)
```powershell
npm run dev
```
*Executes `nodemon server.js`, monitoring file changes and auto-restarting.*

### Run Automated Test Suite
```powershell
npm test
```
*Executes `node test_suite.js`, evaluating 34 assertions across all endpoints.*

---

## 7. Database Architecture

The API uses **SQLite** via the `books.db` database file located in the project root directory. Connection logic is encapsulated in `database.js` using `path.join(__dirname, "books.db")` to guarantee correct file resolution regardless of the directory from which the Node process is launched.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL
);
```

### Field Definitions

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each book record |
| `title` | `TEXT` | `NOT NULL` | Title of the book (non-empty string) |
| `author` | `TEXT` | `NOT NULL` | Author of the book (non-empty string) |
| `price` | `REAL` | `NOT NULL` | Positive numeric book price in standard currency units |

### Data Persistence Policy
- `books.db` is maintained without dropping tables on startup (`CREATE TABLE IF NOT EXISTS`).
- Pre-existing records and auto-increment sequences (`sqlite_sequence`) are preserved.

---

## 8. Complete API Endpoint Documentation

Base URL: `http://localhost:3000`

### A. System Endpoints

#### 1. API Overview
- **URL:** `GET /`
- **Description:** Returns API status, version, and primary resource links.
- **Response:** `200 OK`
```json
{
  "status": "OK",
  "message": "Book Management REST API is running",
  "version": "1.0.0",
  "endpoints": {
    "books": "/books",
    "health": "/health"
  }
}
```

#### 2. Health Check
- **URL:** `GET /health`
- **Description:** Server heartbeat and uptime monitor for cloud health checks.
- **Response:** `200 OK`
```json
{
  "status": "healthy",
  "uptime": 142.58,
  "timestamp": "2026-11-07T21:30:00.000Z"
}
```

---

### B. GET Endpoints

#### 1. Get All Books
- **URL:** `GET /books`
- **Description:** Retrieves all books from the database.
- **Response:** `200 OK`
```json
{
  "message": "Books fetched successfully",
  "count": 2,
  "data": [
    {
      "id": 2,
      "title": "Python Basics",
      "author": "John",
      "price": 450
    },
    {
      "id": 3,
      "title": "Java Advanced",
      "author": "James",
      "price": 750
    }
  ]
}
```

#### 2. Get Book by ID
- **URL:** `GET /books/:id`
- **Description:** Retrieves a single book matching the primary key `:id`.
- **URL Parameter:** `id` (must be a positive integer)
- **Success Response:** `200 OK`
```json
{
  "message": "Book fetched successfully",
  "data": {
    "id": 2,
    "title": "Python Basics",
    "author": "John",
    "price": 450
  }
}
```
- **Error Responses:**
  - `400 Bad Request` if `:id` is not a positive integer:
    ```json
    { "message": "Invalid book ID. ID must be a positive integer" }
    ```
  - `404 Not Found` if book does not exist:
    ```json
    { "message": "Book not found with ID 99999" }
    ```

---

### C. POST Endpoint

#### Create a New Book
- **URL:** `POST /books`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "title": "Node.js REST Architecture",
  "author": "Alex Morgan",
  "price": 520
}
```
- **Validation Rules:**
  - `title`: Required, non-empty string after trimming whitespace.
  - `author`: Required, non-empty string after trimming whitespace.
  - `price`: Required, finite number greater than zero (`> 0`).
- **Success Response:** `201 Created`
```json
{
  "message": "Book added successfully",
  "bookId": 5,
  "data": {
    "id": 5,
    "title": "Node.js REST Architecture",
    "author": "Alex Morgan",
    "price": 520
  }
}
```
- **Error Responses:**
  - `400 Bad Request` (Missing fields):
    ```json
    { "message": "Missing required fields: title, author, and price are required" }
    ```
  - `400 Bad Request` (Negative or zero price):
    ```json
    { "message": "Price must be a positive number greater than 0" }
    ```
  - `400 Bad Request` (Non-numeric price):
    ```json
    { "message": "Price must be a valid number" }
    ```

---

### D. PUT Endpoint

#### Update an Existing Book
- **URL:** `PUT /books/:id`
- **Headers:** `Content-Type: application/json`
- **URL Parameter:** `id` (positive integer)
- **Request Body:**
```json
{
  "title": "Node.js REST Architecture - 2nd Edition",
  "author": "Alex Morgan",
  "price": 590
}
```
- **Success Response:** `200 OK`
```json
{
  "message": "Book updated successfully",
  "data": {
    "id": 5,
    "title": "Node.js REST Architecture - 2nd Edition",
    "author": "Alex Morgan",
    "price": 590
  }
}
```
- **Error Responses:**
  - `400 Bad Request` (Invalid ID or body validation failure).
  - `404 Not Found` (Target ID does not exist in database):
    ```json
    { "message": "Book not found with ID 99999" }
    ```

---

### E. DELETE Endpoint

#### Delete a Book
- **URL:** `DELETE /books/:id`
- **URL Parameter:** `id` (positive integer)
- **Success Response:** `200 OK`
```json
{
  "message": "Book deleted successfully",
  "deletedBook": {
    "id": 5,
    "title": "Node.js REST Architecture - 2nd Edition",
    "author": "Alex Morgan",
    "price": 590
  }
}
```
- **Error Responses:**
  - `400 Bad Request` if `:id` is invalid.
  - `404 Not Found` if the book does not exist:
    ```json
    { "message": "Book not found with ID 99999" }
    ```

---

## 9. Query Parameters & Filtering Guide

All query parameters can be used individually or combined.

### 1. Keyword Search
Filters books where the keyword matches within `title` OR `author` (case-insensitive):
- **URL:** `GET /books?search=python`
- **SQL Implementation:** `(LOWER(title) LIKE LOWER(?) OR LOWER(author) LIKE LOWER(?))` with parameterized `%keyword%`.

### 2. Ascending Sort
Sorts books in ascending order (default column: `price`):
- **URL:** `GET /books?sort=asc`
- **Optional Column Selection:** `GET /books?sortBy=title&sort=asc` (Allowed columns: `id`, `title`, `author`, `price`).

### 3. Descending Sort
Sorts books in descending order:
- **URL:** `GET /books?sort=desc`

### 4. Pagination
Offsets records according to page and limit parameters:
- **URL:** `GET /books?limit=2&page=1`
- **Response Format:**
```json
{
  "message": "Books fetched successfully",
  "count": 2,
  "total": 5,
  "page": 1,
  "totalPages": 3,
  "data": [ ... ]
}
```

### 5. Price Range Filtering
Filters books with prices within `minPrice` and `maxPrice` (inclusive):
- **URL:** `GET /books?minPrice=100&maxPrice=500`

### 6. Combined Query Parameters
Combines search, sorting, pagination, and numeric range filtering in a single request:
- **URL:** `GET /books?search=python&sort=asc&limit=5&page=1&minPrice=100&maxPrice=1000`

---

## 10. Validation & Error Handling Rules

The API incorporates comprehensive validation covering all 16 prescribed edge cases:

| # | Validation Scenario | Trigger Request / Input | Expected Status | Error Message |
| :-: | :--- | :--- | :-: | :--- |
| **1** | Missing `title` | `POST /books` with `{ "author": "John", "price": 400 }` | `400 Bad Request` | `"Missing required fields: title, author, and price are required"` |
| **2** | Missing `author` | `POST /books` with `{ "title": "Book", "price": 400 }` | `400 Bad Request` | `"Missing required fields: title, author, and price are required"` |
| **3** | Missing `price` | `POST /books` with `{ "title": "Book", "author": "John" }` | `400 Bad Request` | `"Missing required fields: title, author, and price are required"` |
| **4** | Empty `title` | `{ "title": "   ", "author": "John", "price": 400 }` | `400 Bad Request` | `"Title is required and must be a non-empty string"` |
| **5** | Empty `author` | `{ "title": "Book", "author": "   ", "price": 400 }` | `400 Bad Request` | `"Author is required and must be a non-empty string"` |
| **6** | Negative `price` | `{ "title": "Book", "author": "John", "price": -50 }` | `400 Bad Request` | `"Price must be a positive number greater than 0"` |
| **7** | Zero `price` | `{ "title": "Book", "author": "John", "price": 0 }` | `400 Bad Request` | `"Price must be a positive number greater than 0"` |
| **8** | String price | `{ "title": "Book", "author": "John", "price": "expensive" }` | `400 Bad Request` | `"Price must be a valid number"` |
| **9** | Invalid book ID | `GET /books/abc` or `PUT /books/-5` | `400 Bad Request` | `"Invalid book ID. ID must be a positive integer"` |
| **10** | Non-existing book ID | `GET /books/99999` or `DELETE /books/99999` | `404 Not Found` | `"Book not found with ID 99999"` |
| **11** | Invalid sorting value | `GET /books?sort=sideways` | `400 Bad Request` | `"Invalid sort parameter. Use 'asc' or 'desc'."` |
| **12** | Invalid page number | `GET /books?page=-1` | `400 Bad Request` | `"Page must be a positive integer"` |
| **13** | Invalid limit | `GET /books?limit=0` | `400 Bad Request` | `"Limit must be a positive integer"` |
| **14** | Invalid minimum price | `GET /books?minPrice=-100` | `400 Bad Request` | `"minPrice must be a valid non-negative number"` |
| **15** | MaxPrice < MinPrice | `GET /books?minPrice=500&maxPrice=200` | `400 Bad Request` | `"Maximum price cannot be lower than minimum price"` |
| **16** | Empty search result | `GET /books?search=nonexistenttermxyz` | `200 OK` | Returns `count: 0`, `data: []`, and message `"No books found matching the search criteria"` |

---

## 11. HTTP Status Codes Reference

| Status Code | Standard Name | Meaning in this Project |
| :-: | :--- | :--- |
| **200** | `OK` | Request succeeded. Used for successful `GET`, `PUT`, and `DELETE` operations. |
| **201** | `Created` | Resource created successfully. Used exclusively for `POST /books`. |
| **400** | `Bad Request` | Client error caused by invalid payload data types, missing fields, or invalid query parameters. |
| **404** | `Not Found` | Requested book ID does not exist, or requested API endpoint route does not match any mounted router. |
| **500** | `Internal Server Error` | Unexpected runtime error. Internal server trace is logged to server console, returning generic JSON to client. |

---

## 12. Debugging Exercises

Below are four realistic backend bugs encountered in Node.js/Express REST API development, explaining how each occurs and how it is resolved.

### Exercise 1: Missing `express.json()` Body-Parsing Middleware
- **Problem Description:** When a client sends a `POST /books` request with a JSON body, the server crashes with:
  ```text
  TypeError: Cannot destructure property 'title' of req.body as it is undefined.
  ```
- **Incorrect Code:**
  ```javascript
  const express = require("express");
  const app = express();
  // Missing app.use(express.json());
  app.use("/books", booksRouter);
  ```
- **Why the Error Occurs:** Express does not parse incoming request bodies by default. Without `express.json()` middleware registered before route handlers, `req.body` remains `undefined`.
- **Corrected Code:**
  ```javascript
  const express = require("express");
  const app = express();
  // Register JSON parser BEFORE mounting routes
  app.use(express.json());
  app.use("/books", booksRouter);
  ```
- **How to Test the Fix:** Submit `POST /books` with `{ "title": "Node.js", "author": "John", "price": 400 }`. The server parses `req.body` and returns `201 Created`.

---

### Exercise 2: SQL Column Name Typo & SQL Injection Vulnerability
- **Problem Description:** A query to fetch books sorted by price crashes the server with SQLite error `SqliteError: no such column: cost`. Additionally, directly interpolating query strings creates SQL injection risks.
- **Incorrect Code:**
  ```javascript
  // Typo: using "cost" instead of "price" & direct string concatenation
  const sortCol = req.query.sortBy;
  const sql = `SELECT * FROM books ORDER BY ${sortCol}`;
  const books = await db.all(sql);
  ```
- **Why the Error Occurs:** SQLite tables strictly enforce column names declared in schema. If a query references `cost`, SQLite rejects the statement. Furthermore, interpolating `req.query.sortBy` directly into SQL allows malicious SQL injections (e.g., `?sortBy=price; DROP TABLE books;--`).
- **Corrected Code:**
  ```javascript
  const allowedSortColumns = ["id", "title", "author", "price"];
  const sortColumn = allowedSortColumns.includes(req.query.sortBy?.toLowerCase())
      ? req.query.sortBy.toLowerCase()
      : "price";
  const sortDirection = req.query.sort?.toLowerCase() === "desc" ? "DESC" : "ASC";

  const books = await db.all(`SELECT * FROM books ORDER BY ${sortColumn} ${sortDirection}`);
  ```
- **How to Test the Fix:** Send `GET /books?sort=asc`. The server safely whitelists the column and direction, returning sorted books with `200 OK`.

---

### Exercise 3: Incorrect Route Path / HTTP Method Mismatch
- **Problem Description:** A client attempting to fetch book ID 2 issues `POST /books/2` instead of `GET /books/2`, or requests `/book/2` (singular), resulting in an unhandled 404 HTML error page.
- **Incorrect Scenario:**
  - Client sends `POST http://localhost:3000/books/2`
  - Or client requests `GET http://localhost:3000/book/2`
- **Why the Error Occurs:** REST architecture maps distinct actions to specific HTTP verbs and resource routes. Express only executes handlers that match both the verb and path. If no route matches, Express falls back to its default 404 handler.
- **Corrected Code:**
  Ensure the client uses `GET http://localhost:3000/books/2`. Additionally, implement a custom catch-all 404 handler in `server.js` returning JSON:
  ```javascript
  app.use((req, res) => {
      res.status(404).json({
          message: "Route not found. Please check the URL and HTTP method."
      });
  });
  ```
- **How to Test the Fix:** Issue a request to `GET /invalid-endpoint`. The API returns `404 Not Found` with a structured JSON message.

---

### Exercise 4: Weak Validation & Unhandled Falsy Values (Negative/Zero Prices)
- **Problem Description:** A client submits `{ "title": "Test", "author": "Author", "price": -100 }` or `{ "price": "cheap" }`, and the server erroneously accepts it into the database.
- **Incorrect Code:**
  ```javascript
  // Weak truthiness check
  if (!req.body.price) {
      return res.status(400).json({ message: "Price required" });
  }
  ```
- **Why the Error Occurs:** In JavaScript, `!price` is `false` for negative numbers (`!-100 === false`), meaning negative numbers bypass the check! Conversely, `!0 === true`, so a zero price incorrectly reports as missing instead of invalid.
- **Corrected Code:**
  ```javascript
  if (typeof price !== "number" || !Number.isFinite(price)) {
      return res.status(400).json({ message: "Price must be a valid number" });
  }
  if (price <= 0) {
      return res.status(400).json({ message: "Price must be a positive number greater than 0" });
  }
  ```
- **How to Test the Fix:** Submit `POST /books` with `{ "title": "Book", "author": "Author", "price": -50 }`. The server intercepts the negative price and returns `400 Bad Request`.

---

## 13. Testing Guide

### Automated Test Suite

An automated test suite covering all 34 assertions is provided in `test_suite.js`.

Run the test suite:
```powershell
npm test
```

Sample output:
```text
==================================================
   LAB 3 REST API - AUTOMATED TEST EXECUTION
==================================================

Database connected successfully (C:\lab 3 rest api\books.db)
--- 1. System & Health Endpoints ---
  [PASS] GET / returns 200 OK
  [PASS] GET /health returns 200 Healthy

--- 2. GET /books & Query Parameters ---
  [PASS] GET /books returns array of books
  [PASS] GET /books/2 returns book ID 2
  [PASS] GET /books/99999 returns 404 Not Found
  [PASS] GET /books/abc returns 400 Invalid ID
  [PASS] GET /books?search=python filters matching books
  [PASS] GET /books empty search returns 200 with empty array
  [PASS] GET /books?sort=asc returns 200
  [PASS] GET /books?sort=desc returns 200
  [PASS] GET /books?sort=invalid returns 400 Bad Request
  [PASS] GET /books?limit=2&page=1 handles pagination
  [PASS] GET /books?page=-1 returns 400 Bad Request
  [PASS] GET /books?limit=0 returns 400 Bad Request
  [PASS] GET /books?minPrice=100&maxPrice=500 filters price range
  [PASS] GET /books?minPrice=-10 returns 400 Bad Request
  [PASS] GET /books?minPrice=500&maxPrice=100 returns 400 (maxPrice < minPrice)
  [PASS] GET combined query parameters return 200

--- 3. POST /books Validation & Creation ---
  [PASS] POST missing fields returns 400
  [PASS] POST empty title string returns 400
  [PASS] POST empty author string returns 400
  [PASS] POST negative price returns 400
  [PASS] POST zero price returns 400
  [PASS] POST string price returns 400
  [PASS] POST valid book returns 201 Created with ID 6

--- 4. PUT /books/:id Validation & Update ---
  [PASS] PUT invalid ID returns 400
  [PASS] PUT non-existent ID returns 404
  [PASS] PUT empty title returns 400
  [PASS] PUT zero price returns 400
  [PASS] PUT valid update returns 200

--- 5. DELETE /books/:id Validation & Deletion ---
  [PASS] DELETE invalid ID returns 400
  [PASS] DELETE non-existent ID returns 404
  [PASS] DELETE valid book (ID 6) returns 200

--- 6. Fallback Route Handling ---
  [PASS] Invalid route returns 404 with JSON message

==================================================
TOTAL TESTS: 34 | PASSED: 34 | FAILED: 0
==================================================
```

---

### Postman Collection

The Postman collection is located at:
`postman/Lab-3-REST-API.postman_collection.json`

#### How to import into Postman:
1. Open Postman.
2. Click **Import** in the top-left navigation.
3. Select `c:\lab 3 rest api\postman\Lab-3-REST-API.postman_collection.json`.
4. Ensure the collection variable `baseUrl` is set to `http://localhost:3000`.
5. Click **Run Collection** to execute all 28 automated requests.

---

### PowerShell / cURL Commands

If Postman is unavailable, all endpoints can be verified directly via PowerShell:

```powershell
# 1. Get all books
Invoke-RestMethod -Uri "http://localhost:3000/books" -Method Get

# 2. Get book by ID
Invoke-RestMethod -Uri "http://localhost:3000/books/2" -Method Get

# 3. Search books
Invoke-RestMethod -Uri "http://localhost:3000/books?search=python" -Method Get

# 4. Sort ascending
Invoke-RestMethod -Uri "http://localhost:3000/books?sort=asc" -Method Get

# 5. Price filtering
Invoke-RestMethod -Uri "http://localhost:3000/books?minPrice=100&maxPrice=500" -Method Get

# 6. POST new book
$body = @{ title = "Cloud Principles"; author = "Sarah"; price = 480 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/books" -Method Post -Body $body -ContentType "application/json"

# 7. PUT update book
$updateBody = @{ title = "Cloud Principles 2nd Ed"; author = "Sarah"; price = 520 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/books/2" -Method Put -Body $updateBody -ContentType "application/json"

# 8. DELETE book
Invoke-RestMethod -Uri "http://localhost:3000/books/5" -Method Delete
```

---

## 14. Screenshots Gallery

All screenshots are genuinely captured from the live application and stored in `screenshots/`:

| # | Description | Preview |
| :-: | :--- | :--- |
| **01** | Server Startup & SQLite Database Initialization | ![01-server-started](screenshots/01-server-started.png) |
| **02** | GET All Books | ![02-get-all-books](screenshots/02-get-all-books.png) |
| **03** | GET Book by ID (ID: 2) | ![03-get-book-by-id](screenshots/03-get-book-by-id.png) |
| **04** | Search Books by Keyword (`?search=python`) | ![04-search-books](screenshots/04-search-books.png) |
| **05** | Sort Books Ascending (`?sort=asc`) | ![05-sort-ascending](screenshots/05-sort-ascending.png) |
| **06** | Sort Books Descending (`?sort=desc`) | ![06-sort-descending](screenshots/06-sort-descending.png) |
| **07** | Pagination (`?limit=2&page=1`) | ![07-pagination](screenshots/07-pagination.png) |
| **08** | Price Range Filtering (`?minPrice=100&maxPrice=500`) | ![08-price-filter](screenshots/08-price-filter.png) |
| **09** | POST Create Book (Success 201) | ![09-post-success](screenshots/09-post-success.png) |
| **10** | POST Input Validation Error (Negative Price 400) | ![10-post-validation](screenshots/10-post-validation.png) |
| **11** | PUT Update Book (Success 200) | ![11-put-success](screenshots/11-put-success.png) |
| **12** | PUT Input Validation Error (Empty Title 400) | ![12-put-validation](screenshots/12-put-validation.png) |
| **13** | DELETE Book (Success 200) | ![13-delete-success](screenshots/13-delete-success.png) |
| **14** | DELETE Non-Existent Book ID (404 Not Found) | ![14-delete-not-found](screenshots/14-delete-not-found.png) |
| **15** | Invalid Route Catch-All (404 Not Found) | ![15-invalid-route](screenshots/15-invalid-route.png) |
| **16** | Debugging Exercise 1: Missing `express.json()` Middleware | ![16-debugging-exercise-1](screenshots/16-debugging-exercise-1.png) |
| **17** | Debugging Exercise 2: SQL Column Typo & Injection Prevention | ![17-debugging-exercise-2](screenshots/17-debugging-exercise-2.png) |

---

## 15. GitHub Preparation

### `.gitignore` Setup
The repository includes a production-ready `.gitignore`:
```gitignore
# Dependencies
node_modules/

# Environment Variables & Secrets
.env
*.env.local

# Logs
npm-debug.log*
*.log

# Operating System Files
.DS_Store
Thumbs.db

# Database WAL files
*.db-journal
*.db-wal
*.db-shm
```

### Database Versioning Best Practice
- **In Local Development & Evaluation:** `books.db` is preserved in the working directory so evaluation environments instantly have access to pre-seeded test records without executing manual setup steps.
- **In Open-Source Team Repositories:** Binary database files (`*.db`) are typically added to `.gitignore`. Instead, database creation is made idempotent via `CREATE TABLE IF NOT EXISTS` in `database.js`, accompanied by a seed script (`seed.js`) that populates initial rows if the table is empty.

---

## 16. Deployment Guide (Render)

The application is configured for deployment on cloud platforms like **Render**:

### Key Deployment Settings
1. **Environment Port:** The server binds dynamically to `process.env.PORT || 3000`:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```
2. **Health Check Path:** Set health check path to `/health`.
3. **Build Command:**
   ```bash
   npm install
   ```
4. **Start Command:**
   ```bash
   node server.js
   ```

### SQLite Persistence on Cloud Hosts
> [!IMPORTANT]
> Render free-tier web services use an ephemeral filesystem. Any records added or modified while running on free tier are reset whenever the service spins down due to inactivity. For persistent SQLite storage in production, attach a **Render Persistent Disk** or migrate the database driver to a hosted PostgreSQL instance.

---

## 17. College Submission Checklist

- [x] **Preserved Database:** Existing database file `books.db` and records (ID 2 & ID 3) are untouched.
- [x] **GET Endpoints:** Implemented `GET /books`, `GET /books/:id`, search, sort asc/desc, pagination, and price range filtering.
- [x] **POST Endpoint:** Implemented `POST /books` with strict validation (positive price, non-empty title/author) returning `201 Created`.
- [x] **PUT Endpoint:** Implemented `PUT /books/:id` verifying resource existence (`404`) and updating records (`200`).
- [x] **DELETE Endpoint:** Implemented `DELETE /books/:id` verifying existence (`404`) and deleting records (`200`).
- [x] **Validation Rules:** All 16 validation edge cases verified.
- [x] **SQL Injection Defense:** All queries parameterized; column names and sorting directions strictly whitelisted.
- [x] **Debugging Exercises:** 4 realistic debugging cases documented with problem, root cause, fix, and verification.
- [x] **Postman Collection:** Complete collection generated at `postman/Lab-3-REST-API.postman_collection.json`.
- [x] **Automated Test Suite:** 34/34 tests pass via `npm test`.
- [x] **Screenshots:** All 17 authentic screenshots generated and saved in `screenshots/`.
- [x] **Documentation:** Comprehensive `README.md` formatted and linked.

---

## 18. Conclusion

This project completes all requirements for Backend Development Fundamentals Lab 3. It establishes a resilient, production-ready RESTful web service demonstrating best practices in API architecture, request validation, database persistence, defensive error handling, automated testing, and comprehensive documentation.

