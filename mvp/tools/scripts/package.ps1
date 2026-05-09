$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dist = Join-Path $root 'dist'
$themeDir = Join-Path $root 'pouchcare-theme'
$pluginDir = Join-Path $root 'pouchcare-builder'

if (-not (Test-Path $dist)) {
  New-Item -ItemType Directory -Path $dist | Out-Null
}

function New-DeterministicZip {
  param(
    [Parameter(Mandatory = $true)] [string] $SourceDir,
    [Parameter(Mandatory = $true)] [string] $DestinationZip,
    [Parameter(Mandatory = $true)] [string] $Prefix
  )

  if (Test-Path $DestinationZip) {
    Remove-Item -LiteralPath $DestinationZip -Force
  }

  $files = Get-ChildItem -Path $SourceDir -Recurse -File | Sort-Object FullName
  $base = [System.IO.Path]::GetFullPath($SourceDir)

  $fileStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::CreateNew)
  try {
    $zip = New-Object System.IO.Compression.ZipArchive($fileStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
    try {
      foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($base.Length).TrimStart([char]92, [char]47) -replace '\\','/'
        $entryName = "$Prefix/$relativePath"
        $entry = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entry.LastWriteTime = [DateTimeOffset]::Parse('2026-01-01T00:00:00Z')

        $entryStream = $entry.Open()
        try {
          $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
          $entryStream.Write($bytes, 0, $bytes.Length)
        }
        finally {
          $entryStream.Dispose()
        }
      }
    }
    finally {
      $zip.Dispose()
    }
  }
  finally {
    $fileStream.Dispose()
  }
}

New-DeterministicZip -SourceDir $themeDir -DestinationZip (Join-Path $dist 'pouchcare-theme-0.1.0.zip') -Prefix 'pouchcare-theme'
New-DeterministicZip -SourceDir $pluginDir -DestinationZip (Join-Path $dist 'pouchcare-builder-0.1.0.zip') -Prefix 'pouchcare-builder'

Write-Host 'Deterministic packages created in mvp/dist'
