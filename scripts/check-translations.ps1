# Translation Checker PowerShell Script
param(
    [string]$SrcPath = "src",
    [string]$LocalesPath = "src/locales"
)

Write-Host "🔍 Translation Checker" -ForegroundColor Blue
Write-Host ("=" * 50) -ForegroundColor Blue

# Check if paths exist
if (-not (Test-Path $SrcPath)) {
    Write-Host "❌ Source path '$SrcPath' not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $LocalesPath)) {
    Write-Host "❌ Locales path '$LocalesPath' not found!" -ForegroundColor Red
    exit 1
}

# Find all t('...') calls in source files
Write-Host "`n📂 Scanning source files..." -ForegroundColor Cyan

$sourceFiles = Get-ChildItem -Path $SrcPath -Recurse -Include "*.tsx","*.ts","*.jsx","*.js" | Where-Object { $_.Name -notlike "*.test.*" -and $_.Name -notlike "*.spec.*" }
Write-Host "Found $($sourceFiles.Count) source files" -ForegroundColor Green

$translationCalls = @()
$pattern = "t\(\s*['""`]([^'""`]+)['""`]\s*\)"

foreach ($file in $sourceFiles) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $translationCalls += @{
                Key = $match.Groups[1].Value
                File = $file.FullName.Replace((Get-Location).Path + "\", "")
            }
        }
    }
}

$uniqueKeys = $translationCalls | ForEach-Object { $_.Key } | Sort-Object -Unique
Write-Host "Found $($translationCalls.Count) translation calls with $($uniqueKeys.Count) unique keys" -ForegroundColor Green

# Load translation files
Write-Host "`n📁 Loading translation files..." -ForegroundColor Cyan

$translations = @{}
$languages = @("en", "pt")

foreach ($lang in $languages) {
    $translationFile = Join-Path $LocalesPath "$lang.json"
    if (Test-Path $translationFile) {
        try {
            $content = Get-Content -Path $translationFile -Raw | ConvertFrom-Json
            $translations[$lang] = $content
            Write-Host "✓ Loaded $lang.json" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to load $lang.json" -ForegroundColor Red
            $translations[$lang] = @{}
        }
    } else {
        Write-Host "✗ $lang.json not found" -ForegroundColor Red
        $translations[$lang] = @{}
    }
}

# Function to check if a nested key exists
function Test-NestedKey {
    param($obj, $key)
    $parts = $key -split '\.'
    $current = $obj
    
    foreach ($part in $parts) {
        if ($current -and $current.PSObject.Properties[$part]) {
            $current = $current.$part
        } else {
            return $false
        }
    }
    return $true
}

# Check for missing translations
Write-Host "`n🔍 Checking for missing translations..." -ForegroundColor Cyan

$missing = @{}
foreach ($lang in $languages) {
    $missing[$lang] = @()
    foreach ($key in $uniqueKeys) {
        if (-not (Test-NestedKey $translations[$lang] $key)) {
            $missing[$lang] += $key
        }
    }
}

# Report results
Write-Host "`n📊 RESULTS" -ForegroundColor Blue
Write-Host ("=" * 50) -ForegroundColor Blue

Write-Host "`n📈 Summary:" -ForegroundColor Cyan
Write-Host "  • Total translation calls: $($translationCalls.Count)" -ForegroundColor Green
Write-Host "  • Unique keys used: $($uniqueKeys.Count)" -ForegroundColor Green
Write-Host "  • Languages checked: $($languages -join ', ')" -ForegroundColor Green

$hasMissing = $false
foreach ($lang in $languages) {
    if ($missing[$lang].Count -gt 0) {
        $hasMissing = $true
        Write-Host "`n❌ Missing in $lang.json ($($missing[$lang].Count) keys):" -ForegroundColor Red
        foreach ($key in $missing[$lang] | Select-Object -First 20) {
            $usage = ($translationCalls | Where-Object { $_.Key -eq $key }).Count
            Write-Host "  • $key (used $usage time$(if($usage -gt 1){'s'}))" -ForegroundColor Yellow
        }
        if ($missing[$lang].Count -gt 20) {
            Write-Host "  ... and $($missing[$lang].Count - 20) more" -ForegroundColor Yellow
        }
    }
}

if (-not $hasMissing) {
    Write-Host "`n🎉 All translations are complete!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Translation issues found. Please review the missing keys above." -ForegroundColor Red
}

Write-Host "`n" + ("=" * 50) -ForegroundColor Blue
