Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WP3 {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
}
"@
foreach ($h in @(1247952, 593936)) {
  [WP3]::ShowWindow([IntPtr]$h, 9) | Out-Null
  [WP3]::SetWindowPos([IntPtr]$h, [IntPtr]::Zero, 30, 60, 520, 620, 0x0040) | Out-Null
}
[WP3]::SetForegroundWindow([IntPtr]1247952) | Out-Null
Start-Sleep -Seconds 2
"done"
