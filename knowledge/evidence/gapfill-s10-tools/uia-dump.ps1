# uia-dump.ps1 -TitlePrefix "sr probe" -Out <file.txt>
# Dumps the Windows UI Automation tree (raw view) of the first top-level window whose name starts with TitlePrefix,
# from its Document element down: depth, control type, name. This is the platform accessibility layer that Windows
# screen readers consume (Narrator via UIA; NVDA/JAWS use IA2/MSAA from the same browser tree), one level closer to
# real speech than a browser's internal computed name. Own code; Windows PowerShell 5.1.
param([string]$TitlePrefix = "sr probe", [string]$Out = "uia.txt", [int]$WaitSeconds = 20)
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$A = [System.Windows.Automation.AutomationElement]
$T = [System.Windows.Automation.TreeScope]
$walker = [System.Windows.Automation.TreeWalker]::RawViewWalker
$win = $null
$deadline = (Get-Date).AddSeconds($WaitSeconds)
while (-not $win -and (Get-Date) -lt $deadline) {
  foreach ($w in $A::RootElement.FindAll($T::Children, [System.Windows.Automation.Condition]::TrueCondition)) {
    try { if ($w.Current.Name -like "$TitlePrefix*") { $win = $w; break } } catch {}
  }
  if (-not $win) { Start-Sleep -Milliseconds 500 }
}
if (-not $win) { "NO WINDOW starting with '$TitlePrefix'" | Out-File -Encoding utf8 $Out; exit 1 }
$docCond = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::Document)
$doc = $null
$deadline = (Get-Date).AddSeconds($WaitSeconds)
while (-not $doc -and (Get-Date) -lt $deadline) {
  # the browser UI may contain more than one Document; take the one whose name is the page title
  foreach ($d in $win.FindAll($T::Descendants, $docCond)) { try { if ($d.Current.Name -like "$TitlePrefix*") { $doc = $d; break } } catch {} }
  if (-not $doc) { Start-Sleep -Milliseconds 500 }
}
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("window: " + $win.Current.Name + " | class " + $win.Current.ClassName + " | framework " + $win.Current.FrameworkId)
if (-not $doc) { $lines.Add("NO DOCUMENT"); $lines | Out-File -Encoding utf8 $Out; exit 1 }
function Walk($el, [int]$depth) {
  if ($depth -gt 12) { return }
  $c = $el.Current
  $ct = $c.ControlType.ProgrammaticName -replace '^ControlType\.', ''
  $lines.Add(("  " * $depth) + $ct + " | name=" + ('"' + $c.Name + '"') + " | aid=" + $c.AutomationId + " | lct=" + $c.LocalizedControlType)
  $child = $walker.GetFirstChild($el)
  while ($child) { Walk $child ($depth + 1); $child = $walker.GetNextSibling($child) }
}
Walk $doc 0
$lines | Out-File -Encoding utf8 $Out
"ok " + $lines.Count + " lines -> " + $Out
