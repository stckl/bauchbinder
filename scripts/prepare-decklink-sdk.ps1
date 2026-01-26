#
# Prepare DeckLink SDK for GitHub Secrets (Windows)
#
# Usage:
#   .\scripts\prepare-decklink-sdk.ps1 -Platform win
#   .\scripts\prepare-decklink-sdk.ps1 -Platform mac
#
# Prerequisites:
#   Place the Blackmagic_DeckLink_SDK_*.zip in the sdk-download/ folder
#

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("mac", "win")]
    [string]$Platform
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$SdkDownloadDir = Join-Path $ProjectDir "sdk-download"

# Find SDK ZIP
$SdkZip = Get-ChildItem -Path $SdkDownloadDir -Filter "Blackmagic_DeckLink_SDK*.zip" -File | Select-Object -First 1

if (-not $SdkZip) {
    Write-Error "No Blackmagic_DeckLink_SDK*.zip found in sdk-download/"
    Write-Host "Please download the SDK from:"
    Write-Host "  https://www.blackmagicdesign.com/support/family/capture-and-playback"
    exit 1
}

Write-Host "Found SDK: $($SdkZip.FullName)"

# Determine source path based on platform
if ($Platform -eq "mac") {
    $SdkSubPath = "Mac/include"
} else {
    $SdkSubPath = "Win/include"
}

# Required files
$requiredFiles = @(
    "DeckLinkAPI.h"
    "DeckLinkAPIConfiguration.h"
    "DeckLinkAPIDeckControl.h"
    "DeckLinkAPIDiscovery.h"
    "DeckLinkAPIModes.h"
    "DeckLinkAPITypes.h"
    "DeckLinkAPIVersion.h"
    "DeckLinkAPIDispatch.cpp"
)

# Create temp directories
$TempExtract = Join-Path $env:TEMP "decklink-sdk-extract"
$TempOutput = Join-Path $env:TEMP "decklink-sdk-output"

if (Test-Path $TempExtract) { Remove-Item -Recurse -Force $TempExtract }
if (Test-Path $TempOutput) { Remove-Item -Recurse -Force $TempOutput }

New-Item -ItemType Directory -Path $TempExtract | Out-Null
New-Item -ItemType Directory -Path $TempOutput | Out-Null

Write-Host "Extracting SDK..."
Expand-Archive -Path $SdkZip.FullName -DestinationPath $TempExtract

# Find SDK root folder
$SdkRoot = Get-ChildItem -Path $TempExtract -Directory -Filter "Blackmagic*" | Select-Object -First 1
if (-not $SdkRoot) {
    $SdkRoot = Get-Item $TempExtract
}

$IncludePath = Join-Path $SdkRoot.FullName $SdkSubPath

if (-not (Test-Path $IncludePath)) {
    Write-Error "Include path not found: $SdkSubPath"
    Write-Host "Available contents:"
    Get-ChildItem $SdkRoot.FullName
    Remove-Item -Recurse -Force $TempExtract, $TempOutput
    exit 1
}

Write-Host "Found include path: $IncludePath"
Write-Host ""
Write-Host "Copying header files..."

foreach ($file in $requiredFiles) {
    $srcPath = Join-Path $IncludePath $file
    if (Test-Path $srcPath) {
        Copy-Item $srcPath $TempOutput
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [--] $file (not found)" -ForegroundColor Yellow
    }
}

# Check we got the main header
if (-not (Test-Path (Join-Path $TempOutput "DeckLinkAPI.h"))) {
    Write-Error "DeckLinkAPI.h not found!"
    Remove-Item -Recurse -Force $TempExtract, $TempOutput
    exit 1
}

# Create small ZIP
$OutputZip = Join-Path $env:TEMP "decklink-sdk-$Platform.zip"
if (Test-Path $OutputZip) { Remove-Item $OutputZip }

Write-Host ""
Write-Host "Creating ZIP archive..."
Compress-Archive -Path "$TempOutput\*" -DestinationPath $OutputZip

$ZipSize = (Get-Item $OutputZip).Length
Write-Host "ZIP size: $ZipSize bytes ($([math]::Round($ZipSize / 1024)) KB)"

# Base64 encode
Write-Host ""
Write-Host "Base64 encoding..."
$Base64File = Join-Path $env:TEMP "decklink-sdk-$Platform.b64"
$bytes = [System.IO.File]::ReadAllBytes($OutputZip)
$base64 = [System.Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText($Base64File, $base64)

$Base64Size = (Get-Item $Base64File).Length
Write-Host "Base64 size: $Base64Size bytes ($([math]::Round($Base64Size / 1024)) KB)"

# Check limits
if ($Base64Size -gt 49152) {
    Write-Host ""
    Write-Host "WARNING: Base64 output exceeds GitHub Secret limit (48KB)" -ForegroundColor Red
} else {
    Write-Host "OK - Size OK for GitHub Secrets" -ForegroundColor Green
}

# Cleanup
Remove-Item -Recurse -Force $TempExtract, $TempOutput

Write-Host ""
Write-Host "=========================================="
Write-Host "Done!"
Write-Host ""
Write-Host "Output files:"
Write-Host "  ZIP:    $OutputZip"
Write-Host "  Base64: $Base64File"
Write-Host ""
Write-Host "To add to GitHub Secrets:"
Write-Host "  1. Go to: Repository -> Settings -> Secrets -> Actions"
Write-Host "  2. Click 'New repository secret'"
if ($Platform -eq "mac") {
    Write-Host "  3. Name: DECKLINK_SDK_MAC"
} else {
    Write-Host "  3. Name: DECKLINK_SDK_WIN"
}
Write-Host "  4. Value: Paste contents of $Base64File"
Write-Host ""
Write-Host "Quick copy to clipboard:"
Write-Host "  Get-Content $Base64File | Set-Clipboard"
Write-Host "=========================================="
