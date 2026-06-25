param(
    [Parameter(Mandatory=$true)]
    [string]$HtmlFilePath,
    [string[]]$TestEmails = @(),
    [string]$Subject = "Newsletter Test",
    [switch]$PreviewOnly
)

function Test-Outlook {
    try {
        $outlook = New-Object -ComObject Outlook.Application
        Write-Host "SUCCESS: Outlook connected" -ForegroundColor Green
        return $outlook
    }
    catch {
        Write-Host "ERROR: Could not connect to Outlook" -ForegroundColor Red
        return $null
    }
}

# Check file
if (-not (Test-Path $HtmlFilePath)) {
    Write-Host "ERROR: File not found: $HtmlFilePath" -ForegroundColor Red
    exit 1
}

$htmlContent = Get-Content $HtmlFilePath -Raw
Write-Host "SUCCESS: HTML file loaded" -ForegroundColor Green

# Test Outlook
$outlook = Test-Outlook
if ($null -eq $outlook) {
    Write-Host "Try manual copy-paste instead" -ForegroundColor Yellow
    exit 1
}

# Create and display email
try {
    $mail = $outlook.CreateItem(0)
    $mail.To = "test@test.com"
    $mail.Subject = "$Subject - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    $mail.HTMLBody = $htmlContent
    
    if ($PreviewOnly) {
        $mail.Display()
        Write-Host "Preview opened!" -ForegroundColor Green
    } else {
        $mail.Send()
        Write-Host "Email sent!" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
