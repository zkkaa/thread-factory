param(
  [string[]]$Full = @(
    'src/game/*',
    'src/controller/*',
    'src/engine/tools.ts',
    'src/engine/types.ts',
    'src/levels/types.ts',
    'src/ui/doorSlots.ts',
    'src/ui/toolSpans.ts',
    'src/ui/screens/PlayScreen.tsx',
    'src/ui/components/hud/ToolboxHud.tsx'
  ),
  [string[]]$Extra = @()
)

$ErrorActionPreference = 'Stop'
Set-Location (git rev-parse --show-toplevel)
$outFile = Join-Path (Get-Location) 'PROJECT_SNAPSHOT.md'
$fence = '```'
$sb = New-Object System.Text.StringBuilder
function Add([string]$text) { [void]$sb.AppendLine($text) }

$files = @(git ls-files src public docs scripts) | Where-Object { $_ }
$src = $files | Where-Object { $_ -like 'src/*' -and $_ -notlike '*__test*' }
$tests = $files | Where-Object { $_ -like 'src/*' -and $_ -like '*__test*' }

Add "# Snapshot proyek ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"

Add "`n## Git"
Add "$fence"
Add "cabang: $(git branch --show-current)"
git status --short | ForEach-Object { Add $_ }
git --no-pager log --oneline -15 | ForEach-Object { Add $_ }
Add "$fence"

Add "`n## Tugas dicentang di docs/TASKS.md"
$done = Select-String -Path 'docs/TASKS.md' -Pattern '^- \[x\] \*\*[TU]-\d+' -Encoding UTF8 |
  ForEach-Object { ($_.Line -replace '^- \[x\] \*\*', '') }
Add ($done -join ' ')

Add "`n## package.json"
$pkg = Get-Content package.json -Raw -Encoding UTF8 | ConvertFrom-Json
Add "$fence"
Add "scripts: $(($pkg.scripts.PSObject.Properties | ForEach-Object { $_.Name }) -join ', ')"
Add "dependencies:"
$pkg.dependencies.PSObject.Properties | ForEach-Object { Add "  $($_.Name) $($_.Value)" }
Add "devDependencies:"
$pkg.devDependencies.PSObject.Properties | ForEach-Object { Add "  $($_.Name) $($_.Value)" }
Add "$fence"

Add "`n## Berkas (jalur, jumlah baris)"
Add "$fence"
foreach ($f in $files) {
  if ($f -match '\.(png|jpg|ogg|mp3)$') { Add "$f  (aset)"; continue }
  $n = (Get-Content $f -Encoding UTF8 | Measure-Object -Line).Lines
  Add "$f  ($n)"
}
Add "$fence"

Add "`n## Kerangka ekspor (non-tes)"
Add "$fence"
foreach ($f in $src) {
  $hits = Select-String -Path $f -Pattern '^export|^(interface|type|class|function) ' -Encoding UTF8
  if ($hits) {
    Add "# $f"
    $hits | ForEach-Object { Add "  $($_.LineNumber): $($_.Line.Trim())" }
  }
}
Add "$fence"

Add "`n## Tes (blok describe)"
Add "$fence"
foreach ($f in $tests) {
  $hits = Select-String -Path $f -Pattern "^\s*describe\(" -Encoding UTF8
  if ($hits) {
    Add "# $f"
    $hits | ForEach-Object { Add "  $($_.Line.Trim())" }
  }
}
Add "$fence"

Add "`n## Isi berkas lengkap"
$patterns = $Full + $Extra
$full = $files | Where-Object {
  $f = $_
  $f -notlike '*__test*' -and $f -notmatch '\.(png|jpg|ogg|mp3)$' -and
  ($patterns | Where-Object { $f -like $_ })
}
foreach ($f in $full) {
  Add "`n### $f"
  Add "$fence"
  Add (Get-Content $f -Raw -Encoding UTF8)
  Add "$fence"
}

[System.IO.File]::WriteAllText($outFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
$kb = [math]::Round((Get-Item $outFile).Length / 1KB)
Write-Host "Selesai: $outFile ($kb KB, $($full.Count) berkas penuh)"