# frontend/ -> docs/ senkronizasyonu (GitHub Pages)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$src = Join-Path $root "frontend"
$dest = Join-Path $root "docs"

if (-not (Test-Path $dest)) {
  New-Item -ItemType Directory -Path $dest | Out-Null
}

Copy-Item -Path (Join-Path $src "*") -Destination $dest -Recurse -Force
Write-Host "docs/ guncellendi."
