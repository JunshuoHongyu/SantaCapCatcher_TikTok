Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, 26272)
$wins = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $cond)
foreach ($w in $wins) {
  "WINDOW: '" + $w.Current.Name + "' class=" + $w.Current.ClassName + " rect=" + $w.Current.BoundingRectangle
  $all = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
  $i = 0
  foreach ($e in $all) {
    $ct = $e.Current.ControlType.ProgrammaticName
    if ($ct -match "Button|Text|Window|Pane|Document|Custom" -and $e.Current.Name -ne "") {
      "  [" + $ct + "] '" + $e.Current.Name + "' rect=" + $e.Current.BoundingRectangle
    }
    $i++
    if ($i -gt 120) { break }
  }
}
