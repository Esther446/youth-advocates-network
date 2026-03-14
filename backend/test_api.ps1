
$BASE_URL = "https://yan-backend-gagz.onrender.com/api/v1"

function Test-Endpoint {
    param($method, $path, $body = $null, $token = $null)
    $url = "$BASE_URL$path"
    $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
    $headers.Add("Content-Type", "application/json")
    if ($token) { $headers.Add("Authorization", "Bearer $token") }
    
    Write-Host "`nTesting $method $path..." -ForegroundColor Cyan
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
        }
        if ($body) {
            $params.Body = $body | ConvertTo-Json
        }
        
        $res = Invoke-RestMethod @params
        Write-Host "Success!" -ForegroundColor Green
        return $res
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            Write-Host "Server Response: $content" -ForegroundColor Yellow
        }
        return $null
    }
}

# 1. Public Routes
Write-Host "--- PUBLIC ROUTES ---" -ForegroundColor Magenta
Test-Endpoint "GET" "/organizations"
Test-Endpoint "GET" "/events"
Test-Endpoint "GET" "/opportunities"
Test-Endpoint "GET" "/gallery"

# 2. Auth - Register & Login
Write-Host "`n--- AUTH ROUTES ---" -ForegroundColor Magenta
$testEmail = "test_member_$(Get-Random)@example.com"
$regBody = @{
    name = "Test Member"
    email = $testEmail
    password = "Password123"
}
$regRes = Test-Endpoint "POST" "/auth/register" $regBody
if ($regRes) {
    $memberToken = $regRes.token
    Write-Host "Member Registered. Token obtained." -ForegroundColor Gray
}

$adminBody = @{
    email = "admin@example.com"
    password = "admin123"
}
$adminRes = Test-Endpoint "POST" "/auth/login" $adminBody
if ($adminRes) {
    $adminToken = $adminRes.token
    Write-Host "Admin Logged In. Token obtained." -ForegroundColor Gray
}

# 3. Member Routes
if ($memberToken) {
    Write-Host "`n--- MEMBER PROTECTED ROUTES ---" -ForegroundColor Magenta
    Test-Endpoint "GET" "/auth/me" $null $memberToken
    Test-Endpoint "GET" "/enrollments" $null $memberToken
    Test-Endpoint "GET" "/applications/mine" $null $memberToken
}

# 4. Admin Routes
if ($adminToken) {
    Write-Host "`n--- ADMIN PROTECTED ROUTES ---" -ForegroundColor Magenta
    Test-Endpoint "GET" "/admin/users" $null $adminToken
    Test-Endpoint "GET" "/admin/system-stats" $null $adminToken
    Test-Endpoint "GET" "/admin/lms-analytics" $null $adminToken
    Test-Endpoint "GET" "/admin/recent-applications" $null $adminToken
}
