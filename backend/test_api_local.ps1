
$BASE_URL = "http://localhost:5000/api/v1"

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

# 2. Auth - Register & Login
Write-Host "`n--- AUTH ROUTES ---" -ForegroundColor Magenta
$testEmail = "test_member_$(Get-Random)@example.com"
$regBody = @{
    name = "Local Test Member"
    email = $testEmail
    password = "Password123"
}
$regRes = Test-Endpoint "POST" "/auth/register" $regBody
if ($regRes) {
    $token = $regRes.token
    Write-Host "Member Registered. Token obtained." -ForegroundColor Gray
    
    # 3. Member Routes
    Write-Host "`n--- MEMBER PROTECTED ROUTES ---" -ForegroundColor Magenta
    Test-Endpoint "GET" "/auth/me" $null $token
    Test-Endpoint "GET" "/applications/mine" $null $token
}
