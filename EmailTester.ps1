# Enhanced Email Testing Script with Debugging
# Save this as EmailTester-Debug.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$HtmlFilePath,
    
    [Parameter(Mandatory=$false)]
    [string[]]$TestEmails = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$Subject = "Newsletter Test",
    
    [Parameter(Mandatory=$false)]
    [switch]$PreviewOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$Debug
)

function Write-DebugInfo {
    param([string]$Message, [string]$Color = "Cyan")
    if ($Debug) {
        Write-Host "[DEBUG] $Message" -ForegroundColor $Color
    }
}

function Test-OutlookDetailed {
    Write-Host "`n🔍 Testing Outlook Connection..." -ForegroundColor Cyan
    
    try {
        # Test if Outlook is running
        $outlookProcess = Get-Process -Name "OUTLOOK" -ErrorAction SilentlyContinue
        if ($outlookProcess) {
            Write-Host "✅ Outlook process is running (PID: $($outlookProcess.Id))" -ForegroundColor Green
        } else {
            Write-Host "❌ Outlook process not found. Please start Outlook first." -ForegroundColor Red
            return $null
        }
        
        # Test COM object creation
        Write-DebugInfo "Creating Outlook COM object..."
        $outlook = New-Object -ComObject Outlook.Application
        Write-Host "✅ Outlook COM object created successfully" -ForegroundColor Green
        
        # Test namespace access
        Write-DebugInfo "Testing namespace access..."
        $namespace = $outlook.GetNamespace("MAPI")
        Write-Host "✅ MAPI namespace accessible" -ForegroundColor Green
        
        # Get current user info
        try {
            $currentUser = $namespace.CurrentUser
            if ($currentUser) {
                Write-Host "✅ Current user: $($currentUser.Name)" -ForegroundColor Green
                Write-DebugInfo "User address: $($currentUser.Address)"
            }
        } catch {
            Write-Host "⚠️  Could not get current user info" -ForegroundColor Yellow
        }
        
        # Test mail folder access
        try {
            $outbox = $namespace.GetDefaultFolder(4)  # 4 = Outbox
            Write-Host "✅ Outbox folder accessible" -ForegroundColor Green
            Write-DebugInfo "Outbox items count: $($outbox.Items.Count)"
        } catch {
            Write-Host "⚠️  Could not access Outbox folder" -ForegroundColor Yellow
        }
        
        return $outlook
    }
    catch {
        Write-Host "❌ Outlook connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-DebugInfo "Full error: $($_.Exception.ToString())"
        return $null
    }
}

function Send-TestEmailWithDebug {
    param(
        [object]$OutlookApp,
        [string]$HtmlContent,
        [string]$ToEmail,
        [string]$EmailSubject
    )
    
    Write-Host "`n📧 Preparing email for: $ToEmail" -ForegroundColor Cyan
    
    try {
        Write-DebugInfo "Creating mail item..."
        $mail = $OutlookApp.CreateItem(0)  # 0 = olMailItem
        
        Write-DebugInfo "Setting email properties..."
        $mail.To = $ToEmail
        $mail.Subject = "$EmailSubject - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        $mail.HTMLBody = $HtmlContent
        
        # Add some debug properties
        $mail.Importance = 1  # Normal importance
        Write-DebugInfo "Email size: $([System.Text.Encoding]::UTF8.GetByteCount($HtmlContent)) bytes"
        
        if ($PreviewOnly) {
            Write-Host "📋 Opening email preview..." -ForegroundColor Yellow
            $mail.Display()
            Write-Host "✅ Preview displayed for: $ToEmail" -ForegroundColor Green
        } else {
            Write-Host "📤 Attempting to send email..." -ForegroundColor Yellow
            
            # Try to send and capture any errors
            $mail.Send()
            
            Write-Host "✅ Send command executed for: $ToEmail" -ForegroundColor Green
            Write-Host "   📍 Check your Outbox and Sent Items folders" -ForegroundColor Cyan
            
            # Wait a moment and check outbox
            Start-Sleep -Seconds 2
            try {
                $namespace = $OutlookApp.GetNamespace("MAPI")
                $outbox = $namespace.GetDefaultFolder(4)  # Outbox
                $sentItems = $namespace.GetDefaultFolder(5)  # Sent Items
                
                Write-DebugInfo "Outbox items after send: $($outbox.Items.Count)"
                Write-DebugInfo "Sent items count: $($sentItems.Items.Count)"
                
                if ($outbox.Items.Count -gt 0) {
                    Write-Host "⚠️  Email might be stuck in Outbox. Check your connection." -ForegroundColor Yellow
                }
            } catch {
                Write-DebugInfo "Could not check folders: $($_.Exception.Message)"
            }
        }
    }
    catch {
        Write-Host "❌ Failed to send email to $ToEmail" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-DebugInfo "Full error details: $($_.Exception.ToString())"
        
        # Suggest solutions based on error
        if ($_.Exception.Message -like "*0x80040201*") {
            Write-Host "💡 This looks like a MAPI error. Try restarting Outlook." -ForegroundColor Yellow
        } elseif ($_.Exception.Message -like "*permission*") {
            Write-Host "💡 This looks like a permission error. Run PowerShell as Administrator." -ForegroundColor Yellow
        }
    }
}

function Test-EmailDelivery {
    Write-Host "`n🔍 Testing Email Delivery Options..." -ForegroundColor Cyan
    
    # Check if using Exchange
    try {
        $outlook = New-Object -ComObject Outlook.Application
        $namespace = $outlook.GetNamespace("MAPI")
        $accounts = $outlook.Session.Accounts
        
        Write-Host "📬 Email Accounts Found:" -ForegroundColor Cyan
        for ($i = 1; $i -le $accounts.Count; $i++) {
            $account = $accounts.Item($i)
            Write-Host "   $i. $($account.DisplayName) ($($account.AccountType))" -ForegroundColor White
            Write-DebugInfo "      Server: $($account.SmtpAddress)"
        }
    } catch {
        Write-Host "⚠️  Could not enumerate email accounts" -ForegroundColor Yellow
    }
}

function Show-AlternativeMethods {
    Write-Host "`n🔧 Alternative Testing Methods:" -ForegroundColor Cyan
    Write-Host "1. Manual Copy-Paste Method:" -ForegroundColor Yellow
    Write-Host "   - Open the HTML file in a browser" -ForegroundColor White
    Write-Host "   - Select all (Ctrl+A) and copy (Ctrl+C)" -ForegroundColor White
    Write-Host "   - Create new email in Outlook" -ForegroundColor White
    Write-Host "   - Paste into the email body" -ForegroundColor White
    
    Write-Host "`n2. Outlook Web App Method:" -ForegroundColor Yellow
    Write-Host "   - Go to outlook.office.com or outlook.office365.com" -ForegroundColor White
    Write-Host "   - Compose new email" -ForegroundColor White
    Write-Host "   - Switch to HTML view" -ForegroundColor White
    Write-Host "   - Paste your HTML code" -ForegroundColor White
    
    Write-Host "`n3. File Association Method:" -ForegroundColor Yellow
    Write-Host "   - Rename your HTML file to .eml" -ForegroundColor White
    Write-Host "   - Double-click to open in Outlook" -ForegroundColor White
    
    Write-Host "`n4. Direct SMTP Method (if Exchange configured):" -ForegroundColor Yellow
    Write-Host "   - Use Send-MailMessage PowerShell cmdlet" -ForegroundColor White
    Write-Host "   - Requires SMTP server configuration" -ForegroundColor White
}

# Main Script Execution
Write-Host "🚀 Enhanced Email Testing Script with Debugging" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Enable debug mode if requested
if ($Debug) {
    Write-Host "🐛 Debug mode enabled" -ForegroundColor Yellow
}

# Validate HTML file
Write-Host "`n📁 Validating HTML file..." -ForegroundColor Cyan
if (-not (Test-Path $HtmlFilePath)) {
    Write-Host "❌ HTML file not found: $HtmlFilePath" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Files in current directory:" -ForegroundColor Yellow
    Get-ChildItem -Name | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    exit 1
}

$htmlContent = Get-Content $HtmlFilePath -Raw
if ([string]::IsNullOrEmpty($htmlContent)) {
    Write-Host "❌ HTML file is empty" -ForegroundColor Red
    exit 1
}

Write-Host "✅ HTML file loaded successfully ($($htmlContent.Length) characters)" -ForegroundColor Green

# Test Outlook connection with detailed info
$outlook = Test-OutlookDetailed
if ($null -eq $outlook) {
    Write-Host "`n❌ Cannot proceed without Outlook connection" -ForegroundColor Red
    Show-AlternativeMethods
    exit 1
}

# Test email delivery options
Test-EmailDelivery

# Process test emails
if ($TestEmails.Count -eq 0) {
    $TestEmails = @("$env:USERNAME@$env:USERDNSDOMAIN")
    Write-Host "`n📧 No test emails provided. Using your domain email: $($TestEmails[0])" -ForegroundColor Yellow
    $confirm = Read-Host "Continue with this email? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        exit 0
    }
}

# Send emails with detailed debugging
foreach ($email in $TestEmails) {
    Send-TestEmailWithDebug -OutlookApp $outlook -HtmlContent $htmlContent -ToEmail $email -EmailSubject $Subject
    Start-Sleep -Seconds 1
}

Write-Host "`n✅ Script execution completed!" -ForegroundColor Green

if (-not $PreviewOnly) {
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check your Outlook Outbox folder" -ForegroundColor White
    Write-Host "2. Check your Sent Items folder" -ForegroundColor White
    Write-Host "3. Check the recipient's inbox (and spam folder)" -ForegroundColor White
    Write-Host "4. If email is stuck in Outbox, try Send/Receive (F9)" -ForegroundColor White
}

# Cleanup
$outlook = $null
[System.GC]::Collect()