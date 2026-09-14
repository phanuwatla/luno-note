using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

class Program {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    const byte VK_CONTROL = 0x11;
    const byte VK_W = 0x57;
    const uint KEYEVENTF_KEYUP = 0x0002;

    static void SendCtrlW() {
        keybd_event(VK_CONTROL, 0x1D, 0, 0);
        Thread.Sleep(30);
        keybd_event(VK_W, 0x11, 0, 0);
        Thread.Sleep(30);
        keybd_event(VK_W, 0x11, KEYEVENTF_KEYUP, 0);
        Thread.Sleep(30);
        keybd_event(VK_CONTROL, 0x1D, KEYEVENTF_KEYUP, 0);
    }

    [STAThread]
    static void Main(string[] args) {
        try {
            IntPtr fg = GetForegroundWindow();
            if (fg != IntPtr.Zero) {
                uint pid;
                GetWindowThreadProcessId(fg, out pid);
                string procName = "";
                try {
                    procName = Process.GetProcessById((int)pid).ProcessName.ToLower();
                } catch {}

                if (!procName.Contains("luno") && !procName.Contains("electron")) {
                    SetForegroundWindow(fg);
                    Thread.Sleep(30);
                    SendCtrlW();
                    return;
                }
            }

            EnumWindows((hWnd, lParam) => {
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(hWnd, sb, 256);
                string title = sb.ToString();
                if (title.IndexOf("Google Drive Sync", StringComparison.OrdinalIgnoreCase) >= 0) {
                    SetForegroundWindow(hWnd);
                    Thread.Sleep(50);
                    SendCtrlW();
                    return false;
                }
                return true;
            }, IntPtr.Zero);
        } catch {}
    }
}
