param([switch]$CloseDialogs)
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class W2 {
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  public delegate bool EnumProc(IntPtr hWnd, IntPtr p);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$eh = Get-Process | Where-Object { $_.ProcessName -eq 'Effect House' } | Select-Object -First 1
if (-not $eh) { Write-Output 'no EH'; exit }
$target = [uint32]$eh.Id
$list = New-Object System.Collections.ArrayList
$script:found = $list
$cb = [W2+EnumProc]{
  param($h, $p)
  $pp = [uint32]0
  [W2]::GetWindowThreadProcessId($h, [ref]$pp) | Out-Null
  if ($pp -eq $target) {
    $r = New-Object W2+RECT
    [W2]::GetWindowRect($h, [ref]$r) | Out-Null
    $w = $r.Right - $r.Left; $hg = $r.Bottom - $r.Top
    if ($w -gt 150 -and $hg -gt 100) {
      $sb = New-Object System.Text.StringBuilder 256
      [W2]::GetWindowText($h, $sb, 256) | Out-Null
      [void]$script:found.Add([pscustomobject]@{ HWND = [int]$h; X = $r.Left; Y = $r.Top; W = $w; H = $hg; Title = $sb.ToString() })
    }
  }
  return $true
}
[W2]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
$script:found | Format-Table -AutoSize
if ($CloseDialogs) {
  foreach ($it in $script:found) {
    if ($it.W -lt 700 -and $it.H -lt 700) {
      [W2]::PostMessage([IntPtr]$it.HWND, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
      Write-Output ("closed " + $it.HWND)
    }
  }
}
