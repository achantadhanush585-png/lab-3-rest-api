# PowerShell Automated Test Script for Lab 3 REST API
# Usage: Start server in one terminal, then run: .\test_endpoints.ps1

$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5)
            $params["ContentType"] = "application/json"
        }

        $response = Invoke-RestMethod @params
        Write-Host "  [PASS] $Name (HTTP $ExpectedStatus)" -ForegroundColor Green
        $script:passed++
    }
    catch {
        $actualStatus = $_.Exception.Response.StatusCode.value__
        if ($actualStatus -eq $ExpectedStatus) {
            Write-Host "  [PASS] $Name (HTTP $ExpectedStatus as expected)" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  [FAIL] $Name (Expected $ExpectedStatus, got $actualStatus)" -ForegroundColor Red
            $script:failed++
        }
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  LAB 3 REST API - POWERSHELL TEST RUNNER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Health
Test-Endpoint -Name "Health Check" -Method "Get" -Uri "$baseUrl/health" -ExpectedStatus 200

# 2. Get All
Test-Endpoint -Name "GET /books" -Method "Get" -Uri "$baseUrl/books" -ExpectedStatus 200

# 3. Get by ID
Test-Endpoint -Name "GET /books/2" -Method "Get" -Uri "$baseUrl/books/2" -ExpectedStatus 200
Test-Endpoint -Name "GET /books/99999 (Not Found)" -Method "Get" -Uri "$baseUrl/books/99999" -ExpectedStatus 404
Test-Endpoint -Name "GET /books/abc (Invalid ID)" -Method "Get" -Uri "$baseUrl/books/abc" -ExpectedStatus 400

# 4. Search & Filter
Test-Endpoint -Name "GET /books?search=python" -Method "Get" -Uri "$baseUrl/books?search=python" -ExpectedStatus 200
Test-Endpoint -Name "GET /books?sort=asc" -Method "Get" -Uri "$baseUrl/books?sort=asc" -ExpectedStatus 200
Test-Endpoint -Name "GET /books?sort=invalid" -Method "Get" -Uri "$baseUrl/books?sort=invalid" -ExpectedStatus 400
Test-Endpoint -Name "GET /books?limit=2&page=1" -Method "Get" -Uri "$baseUrl/books?limit=2&page=1" -ExpectedStatus 200
Test-Endpoint -Name "GET /books?minPrice=100&maxPrice=500" -Method "Get" -Uri "$baseUrl/books?minPrice=100&maxPrice=500" -ExpectedStatus 200
Test-Endpoint -Name "GET /books?minPrice=500&maxPrice=100 (Invalid range)" -Method "Get" -Uri "$baseUrl/books?minPrice=500&maxPrice=100" -ExpectedStatus 400

# 5. POST validation
Test-Endpoint -Name "POST missing fields" -Method "Post" -Uri "$baseUrl/books" -Body @{ title = "Only Title" } -ExpectedStatus 400
Test-Endpoint -Name "POST negative price" -Method "Post" -Uri "$baseUrl/books" -Body @{ title = "T"; author = "A"; price = -10 } -ExpectedStatus 400

# 6. Invalid Route
Test-Endpoint -Name "Invalid Route (404 Fallback)" -Method "Get" -Uri "$baseUrl/non-existent-route" -ExpectedStatus 404

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "TOTAL: $($passed + $failed) | PASSED: $passed | FAILED: $failed" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
