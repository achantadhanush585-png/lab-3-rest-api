/**
 * Comprehensive Automated Test Suite for Lab 3 REST API
 * Verifies all CRUD endpoints, query filtering, sorting, pagination,
 * error handling, and all 16 input validation cases.
 */

const http = require("http");
const { Duplex } = require("stream");
const connectDB = require("./database");
const express = require("express");
const booksRouter = require("./books");

function invokeApp(app, method, urlPath, body = null) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new Duplex({
            read() {},
            write(chunk, encoding, callback) { callback(); }
        });

        const req = new http.IncomingMessage(socket);
        req.method = method;
        req.url = urlPath;
        req.headers = { host: "localhost:3000" };

        let payload = null;
        if (body !== null) {
            payload = JSON.stringify(body);
            req.headers["content-type"] = "application/json";
            req.headers["content-length"] = Buffer.byteLength(payload);
        }

        const res = new http.ServerResponse(req);
        res.assignSocket(socket);

        let responseText = "";
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);

        res.write = function(chunk, encoding, callback) {
            if (chunk) responseText += chunk.toString();
            return originalWrite(chunk, encoding, callback);
        };

        res.end = function(chunk, encoding, callback) {
            if (chunk) responseText += chunk.toString();
            originalEnd(chunk, encoding, callback);

            let parsedBody = responseText;
            try {
                parsedBody = JSON.parse(responseText);
            } catch (e) {}

            resolve({
                statusCode: res.statusCode,
                body: parsedBody
            });
        };

        app.handle(req, res);

        if (payload !== null) req.push(payload);
        req.push(null);
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("   LAB 3 REST API - AUTOMATED TEST EXECUTION");
    console.log("==================================================\n");

    const app = express();
    app.use(express.json());

    app.get("/", (req, res) => res.status(200).json({ status: "OK", message: "API Running" }));
    app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

    const db = await connectDB();
    app.locals.db = db;
    app.use("/books", booksRouter);

    app.use((req, res) => {
        res.status(404).json({ message: "Route not found. Please check the URL and HTTP method." });
    });

    app.use((err, req, res, next) => {
        res.status(500).json({ message: "Internal server error" });
    });

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`  [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${testName}`);
            failed++;
        }
    }

    console.log("--- 1. System & Health Endpoints ---");
    const rRoot = await invokeApp(app, "GET", "/");
    assert(rRoot.statusCode === 200, "GET / returns 200 OK");
    const rHealth = await invokeApp(app, "GET", "/health");
    assert(rHealth.statusCode === 200 && rHealth.body.status === "healthy", "GET /health returns 200 Healthy");

    console.log("\n--- 2. GET /books & Query Parameters ---");
    const rAll = await invokeApp(app, "GET", "/books");
    assert(rAll.statusCode === 200 && Array.isArray(rAll.body.data), "GET /books returns array of books");

    const rById = await invokeApp(app, "GET", "/books/2");
    assert(rById.statusCode === 200 && rById.body.data.id === 2, "GET /books/2 returns book ID 2");

    const rByIdNotFound = await invokeApp(app, "GET", "/books/99999");
    assert(rByIdNotFound.statusCode === 404, "GET /books/99999 returns 404 Not Found");

    const rByIdInvalid = await invokeApp(app, "GET", "/books/abc");
    assert(rByIdInvalid.statusCode === 400, "GET /books/abc returns 400 Invalid ID");

    const rSearch = await invokeApp(app, "GET", "/books?search=python");
    assert(rSearch.statusCode === 200 && rSearch.body.data.length > 0, "GET /books?search=python filters matching books");

    const rEmptySearch = await invokeApp(app, "GET", "/books?search=nonexistenttermxyz");
    assert(rEmptySearch.statusCode === 200 && rEmptySearch.body.data.length === 0, "GET /books empty search returns 200 with empty array");

    const rSortAsc = await invokeApp(app, "GET", "/books?sort=asc");
    assert(rSortAsc.statusCode === 200, "GET /books?sort=asc returns 200");

    const rSortDesc = await invokeApp(app, "GET", "/books?sort=desc");
    assert(rSortDesc.statusCode === 200, "GET /books?sort=desc returns 200");

    const rInvalidSort = await invokeApp(app, "GET", "/books?sort=invalid_direction");
    assert(rInvalidSort.statusCode === 400, "GET /books?sort=invalid returns 400 Bad Request");

    const rPagination = await invokeApp(app, "GET", "/books?limit=2&page=1");
    assert(rPagination.statusCode === 200 && rPagination.body.page === 1 && rPagination.body.count <= 2, "GET /books?limit=2&page=1 handles pagination");

    const rInvalidPage = await invokeApp(app, "GET", "/books?page=-1");
    assert(rInvalidPage.statusCode === 400, "GET /books?page=-1 returns 400 Bad Request");

    const rInvalidLimit = await invokeApp(app, "GET", "/books?limit=0");
    assert(rInvalidLimit.statusCode === 400, "GET /books?limit=0 returns 400 Bad Request");

    const rPriceFilter = await invokeApp(app, "GET", "/books?minPrice=100&maxPrice=500");
    assert(rPriceFilter.statusCode === 200, "GET /books?minPrice=100&maxPrice=500 filters price range");

    const rInvalidMinPrice = await invokeApp(app, "GET", "/books?minPrice=-10");
    assert(rInvalidMinPrice.statusCode === 400, "GET /books?minPrice=-10 returns 400 Bad Request");

    const rPriceInverted = await invokeApp(app, "GET", "/books?minPrice=500&maxPrice=100");
    assert(rPriceInverted.statusCode === 400, "GET /books?minPrice=500&maxPrice=100 returns 400 (maxPrice < minPrice)");

    const rCombined = await invokeApp(app, "GET", "/books?search=python&sort=asc&limit=5&page=1&minPrice=100&maxPrice=1000");
    assert(rCombined.statusCode === 200, "GET combined query parameters return 200");

    console.log("\n--- 3. POST /books Validation & Creation ---");
    const rPostMissing = await invokeApp(app, "POST", "/books", { title: "Only Title" });
    assert(rPostMissing.statusCode === 400, "POST missing fields returns 400");

    const rPostEmptyTitle = await invokeApp(app, "POST", "/books", { title: "   ", author: "Author", price: 300 });
    assert(rPostEmptyTitle.statusCode === 400, "POST empty title string returns 400");

    const rPostEmptyAuthor = await invokeApp(app, "POST", "/books", { title: "Title", author: "   ", price: 300 });
    assert(rPostEmptyAuthor.statusCode === 400, "POST empty author string returns 400");

    const rPostNegativePrice = await invokeApp(app, "POST", "/books", { title: "Title", author: "Author", price: -100 });
    assert(rPostNegativePrice.statusCode === 400, "POST negative price returns 400");

    const rPostZeroPrice = await invokeApp(app, "POST", "/books", { title: "Title", author: "Author", price: 0 });
    assert(rPostZeroPrice.statusCode === 400, "POST zero price returns 400");

    const rPostStringPrice = await invokeApp(app, "POST", "/books", { title: "Title", author: "Author", price: "invalid" });
    assert(rPostStringPrice.statusCode === 400, "POST string price returns 400");

    const testPayload = { title: "Microservices with Node.js", author: "David Miller", price: 620 };
    const rPostSuccess = await invokeApp(app, "POST", "/books", testPayload);
    const createdId = rPostSuccess.body.bookId;
    assert(rPostSuccess.statusCode === 201 && createdId > 0, `POST valid book returns 201 Created with ID ${createdId}`);

    console.log("\n--- 4. PUT /books/:id Validation & Update ---");
    const rPutInvalidId = await invokeApp(app, "PUT", "/books/-1", testPayload);
    assert(rPutInvalidId.statusCode === 400, "PUT invalid ID returns 400");

    const rPutNotFound = await invokeApp(app, "PUT", "/books/99999", testPayload);
    assert(rPutNotFound.statusCode === 404, "PUT non-existent ID returns 404");

    const rPutEmptyTitle = await invokeApp(app, "PUT", `/books/${createdId}`, { title: "", author: "David", price: 600 });
    assert(rPutEmptyTitle.statusCode === 400, "PUT empty title returns 400");

    const rPutZeroPrice = await invokeApp(app, "PUT", `/books/${createdId}`, { title: "Valid", author: "David", price: 0 });
    assert(rPutZeroPrice.statusCode === 400, "PUT zero price returns 400");

    const rPutSuccess = await invokeApp(app, "PUT", `/books/${createdId}`, { title: "Microservices with Node.js - 2nd Edition", author: "David Miller", price: 680 });
    assert(rPutSuccess.statusCode === 200 && rPutSuccess.body.data.price === 680, "PUT valid update returns 200");

    console.log("\n--- 5. DELETE /books/:id Validation & Deletion ---");
    const rDeleteInvalidId = await invokeApp(app, "DELETE", "/books/not-an-id");
    assert(rDeleteInvalidId.statusCode === 400, "DELETE invalid ID returns 400");

    const rDeleteNotFound = await invokeApp(app, "DELETE", "/books/99999");
    assert(rDeleteNotFound.statusCode === 404, "DELETE non-existent ID returns 404");

    const rDeleteSuccess = await invokeApp(app, "DELETE", `/books/${createdId}`);
    assert(rDeleteSuccess.statusCode === 200, `DELETE valid book (ID ${createdId}) returns 200`);

    console.log("\n--- 6. Fallback Route Handling ---");
    const r404 = await invokeApp(app, "GET", "/invalid-route-endpoint");
    assert(r404.statusCode === 404 && r404.body.message.includes("Route not found"), "Invalid route returns 404 with JSON message");

    console.log("\n==================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error("Test suite runtime error:", err);
    process.exit(1);
});

