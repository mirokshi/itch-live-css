# Same five regex steps as the private repo's .claude/minify-css.ps1 (read 2026-10-14),
# but taking explicit in/out paths. usage: powershell -File repo-regex-minify.ps1 <in.css> <out.css>
param([string]$In, [string]$Out)
$css = [System.IO.File]::ReadAllText($In, [System.Text.Encoding]::UTF8)
$css = [regex]::Replace($css, '/\*[\s\S]*?\*/', '')
$css = [regex]::Replace($css, '\s+', ' ')
$css = [regex]::Replace($css, '\s*([{};,])\s*', '$1')
$css = [regex]::Replace($css, ':\s+', ':')
$css = $css -replace ';}', '}'
$css = $css.Trim()
[System.IO.File]::WriteAllText($Out, $css + "`n", (New-Object System.Text.UTF8Encoding($false)))
