Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")]
public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
[DllImport("user32.dll")]
public static extern IntPtr GetKeyboardLayout(uint idThread);
"@ -Name "Win32Keyboard" -Namespace "Native"

$prev = ""
while ($true) {
    try {
        $hwnd = [Native.Win32Keyboard]::GetForegroundWindow()
        $p = [uint32]0
        $tid = [Native.Win32Keyboard]::GetWindowThreadProcessId($hwnd, [ref]$p)
        $hkl = [Native.Win32Keyboard]::GetKeyboardLayout($tid)
        $langId = ([int64]$hkl) -band 0xFFFF
        $lang = if ($langId -eq 1054) { "th" } else { "en" }
        if ($lang -ne $prev) {
            $prev = $lang
            [Console]::WriteLine($lang)
        }
    } catch {}
    Start-Sleep -Milliseconds 100
}
