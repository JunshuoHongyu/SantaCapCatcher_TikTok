Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WP2 {
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@
[WP2]::ShowWindow([IntPtr]985942, 9) | Out-Null
[WP2]::SetWindowPos([IntPtr]985942, [IntPtr]::Zero, 0, 0, 1280, 780, 0x0040) | Out-Null
[WP2]::SetForegroundWindow([IntPtr]985942) | Out-Null
Start-Sleep -Seconds 3
"done"
