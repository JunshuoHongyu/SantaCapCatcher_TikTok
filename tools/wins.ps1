Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinPos {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  public delegate bool EnumProc(IntPtr hWnd, IntPtr p);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$target = 26272
$list = New-Object System.Collections.ArrayList
$cb = [WinPos+EnumProc]{
  param($h, $p)
  $pid2 = 0
  [WinPos]::GetWindowThreadProcessId($h, [ref]$pid2) | Out-Null
  if ($pid2 -eq $target) {
    $r = New-Object WinPos+RECT
    [WinPos]::GetWindowRect($h, [ref]$r) | Out-Null
    $w = $r.Right - $r.Left; $hgt = $r.Bottom - $r.Top
    if ($w -gt 200 -and $hgt -gt 150) {
      $sb = New-Object System.Text.StringBuilder 256
      [WinPos]::GetWindowText($h, $sb, 256) | Out-Null
      [void]$list.Add([pscustomobject]@{ HWND = $h; X = $r.Left; Y = $r.Top; W = $w; H = $hgt; Title = $sb.ToString() })
    }
  }
  return $true
}
[WinPos]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
$list | Format-Table -AutoSize
