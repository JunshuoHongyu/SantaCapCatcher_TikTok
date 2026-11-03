param([Parameter(Mandatory=$true)][int[]]$Hwnd)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W {
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
}
"@
foreach ($h in $Hwnd) {
  $p = [IntPtr]$h
  if ([W]::IsWindow($p)) {
    $ok = [W]::PostMessage($p, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Output "$h close=$ok"
  } else {
    Write-Output "$h notfound"
  }
}
