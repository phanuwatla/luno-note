using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Luno Note Fix Language Helper")]
[assembly: AssemblyDescription("Lightweight background Windows helper for Luno Note Ctrl+Shift+L Thai/English Fix Language")]
[assembly: AssemblyProduct("Luno Note")]
[assembly: AssemblyCompany("phanuwatla")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace LunoFixLanguageHelper
{
    [DataContract]
    internal class HelperLabels
    {
        [DataMember(Name = "title")] public string Title { get; set; }
        [DataMember(Name = "selectTextFirst")] public string SelectTextFirst { get; set; }
        [DataMember(Name = "trayTooltipActive")] public string TrayTooltipActive { get; set; }
        [DataMember(Name = "trayTooltipPaused")] public string TrayTooltipPaused { get; set; }
        [DataMember(Name = "menuHeader")] public string MenuHeader { get; set; }
        [DataMember(Name = "menuEnabled")] public string MenuEnabled { get; set; }
        [DataMember(Name = "menuOpenApp")] public string MenuOpenApp { get; set; }
        [DataMember(Name = "menuExit")] public string MenuExit { get; set; }
        [DataMember(Name = "conflictBalloon")] public string ConflictBalloon { get; set; }
    }

    [DataContract]
    internal class HelperConfig
    {
        [DataMember(Name = "enabled")] public bool Enabled = true;
        [DataMember(Name = "language")] public string Language = "en";
        [DataMember(Name = "lunoPid")] public int LunoPid = 0;
        [DataMember(Name = "lunoAppPath")] public string LunoAppPath = "";
        [DataMember(Name = "labels")] public HelperLabels Labels = null;
    }

    [DataContract]
    internal class HelperStatus
    {
        [DataMember(Name = "running")] public bool Running;
        [DataMember(Name = "pid")] public int Pid;
        [DataMember(Name = "enabled")] public bool Enabled;
        [DataMember(Name = "registered")] public bool Registered;
        [DataMember(Name = "updatedAt")] public long UpdatedAt;
    }

    internal static class ThaiKeyboardMapper
    {
        private static readonly Dictionary<char, char> EnToTh = new Dictionary<char, char>
        {
            { '0', '\u0E08' },
            { '1', '\u0E45' },
            { '2', '/' },
            { '3', '-' },
            { '4', '\u0E20' },
            { '5', '\u0E16' },
            { '6', '\u0E38' },
            { '7', '\u0E36' },
            { '8', '\u0E04' },
            { '9', '\u0E15' },
            { '`', '_' },
            { '-', '\u0E02' },
            { '=', '\u0E0A' },
            { 'q', '\u0E46' },
            { 'w', '\u0E44' },
            { 'e', '\u0E33' },
            { 'r', '\u0E1E' },
            { 't', '\u0E30' },
            { 'y', '\u0E31' },
            { 'u', '\u0E35' },
            { 'i', '\u0E23' },
            { 'o', '\u0E19' },
            { 'p', '\u0E22' },
            { '[', '\u0E1A' },
            { ']', '\u0E25' },
            { '\\', '\u0E03' },
            { 'a', '\u0E1F' },
            { 's', '\u0E2B' },
            { 'd', '\u0E01' },
            { 'f', '\u0E14' },
            { 'g', '\u0E40' },
            { 'h', '\u0E49' },
            { 'j', '\u0E48' },
            { 'k', '\u0E32' },
            { 'l', '\u0E2A' },
            { ';', '\u0E27' },
            { '\'', '\u0E07' },
            { 'z', '\u0E1C' },
            { 'x', '\u0E1B' },
            { 'c', '\u0E41' },
            { 'v', '\u0E2D' },
            { 'b', '\u0E34' },
            { 'n', '\u0E37' },
            { 'm', '\u0E17' },
            { ',', '\u0E21' },
            { '.', '\u0E43' },
            { '/', '\u0E1D' },
            { '~', '%' },
            { '!', '+' },
            { '@', '\u0E51' },
            { '#', '\u0E52' },
            { '$', '\u0E53' },
            { '%', '\u0E54' },
            { '^', '\u0E39' },
            { '&', '\u0E3F' },
            { '*', '\u0E55' },
            { '(', '\u0E56' },
            { ')', '\u0E57' },
            { '_', '\u0E58' },
            { '+', '\u0E59' },
            { 'Q', '\u0E50' },
            { 'W', '"' },
            { 'E', '\u0E0E' },
            { 'R', '\u0E11' },
            { 'T', '\u0E18' },
            { 'Y', '\u0E4D' },
            { 'U', '\u0E4A' },
            { 'I', '\u0E13' },
            { 'O', '\u0E2F' },
            { 'P', '\u0E0D' },
            { '{', '\u0E10' },
            { '}', ',' },
            { '|', '\u0E05' },
            { 'A', '\u0E24' },
            { 'S', '\u0E06' },
            { 'D', '\u0E0F' },
            { 'F', '\u0E42' },
            { 'G', '\u0E0C' },
            { 'H', '\u0E47' },
            { 'J', '\u0E4B' },
            { 'K', '\u0E29' },
            { 'L', '\u0E28' },
            { ':', '\u0E0B' },
            { '"', '.' },
            { 'Z', '(' },
            { 'X', ')' },
            { 'C', '\u0E09' },
            { 'V', '\u0E2E' },
            { 'B', '\u0E3A' },
            { 'N', '\u0E4C' },
            { 'M', '?' },
            { '<', '\u0E12' },
            { '>', '\u0E2C' },
            { '?', '\u0E26' }
        };

        private static readonly Dictionary<char, char> ThToEn = new Dictionary<char, char>
        {
            { '_', '`' },
            { '\u0E45', '1' },
            { '/', '2' },
            { '-', '3' },
            { '\u0E20', '4' },
            { '\u0E16', '5' },
            { '\u0E38', '6' },
            { '\u0E36', '7' },
            { '\u0E04', '8' },
            { '\u0E15', '9' },
            { '\u0E08', '0' },
            { '\u0E02', '-' },
            { '\u0E0A', '=' },
            { '\u0E46', 'q' },
            { '\u0E44', 'w' },
            { '\u0E33', 'e' },
            { '\u0E1E', 'r' },
            { '\u0E30', 't' },
            { '\u0E31', 'y' },
            { '\u0E35', 'u' },
            { '\u0E23', 'i' },
            { '\u0E19', 'o' },
            { '\u0E22', 'p' },
            { '\u0E1A', '[' },
            { '\u0E25', ']' },
            { '\u0E03', '\\' },
            { '\u0E1F', 'a' },
            { '\u0E2B', 's' },
            { '\u0E01', 'd' },
            { '\u0E14', 'f' },
            { '\u0E40', 'g' },
            { '\u0E49', 'h' },
            { '\u0E48', 'j' },
            { '\u0E32', 'k' },
            { '\u0E2A', 'l' },
            { '\u0E27', ';' },
            { '\u0E07', '\'' },
            { '\u0E1C', 'z' },
            { '\u0E1B', 'x' },
            { '\u0E41', 'c' },
            { '\u0E2D', 'v' },
            { '\u0E34', 'b' },
            { '\u0E37', 'n' },
            { '\u0E17', 'm' },
            { '\u0E21', ',' },
            { '\u0E43', '.' },
            { '\u0E1D', '/' },
            { '%', '~' },
            { '+', '!' },
            { '\u0E51', '@' },
            { '\u0E52', '#' },
            { '\u0E53', '$' },
            { '\u0E54', '%' },
            { '\u0E39', '^' },
            { '\u0E3F', '&' },
            { '\u0E55', '*' },
            { '\u0E56', '(' },
            { '\u0E57', ')' },
            { '\u0E58', '_' },
            { '\u0E59', '+' },
            { '\u0E50', 'Q' },
            { '\u0E0E', 'E' },
            { '\u0E11', 'R' },
            { '\u0E18', 'T' },
            { '\u0E4D', 'Y' },
            { '\u0E4A', 'U' },
            { '\u0E13', 'I' },
            { '\u0E2F', 'O' },
            { '\u0E0D', 'P' },
            { '\u0E10', '{' },
            { '\u0E05', '|' },
            { '\u0E24', 'A' },
            { '\u0E06', 'S' },
            { '\u0E0F', 'D' },
            { '\u0E42', 'F' },
            { '\u0E0C', 'G' },
            { '\u0E47', 'H' },
            { '\u0E4B', 'J' },
            { '\u0E29', 'K' },
            { '\u0E28', 'L' },
            { '\u0E0B', ':' },
            { '(', 'Z' },
            { ')', 'X' },
            { '\u0E09', 'C' },
            { '\u0E2E', 'V' },
            { '\u0E3A', 'B' },
            { '\u0E4C', 'N' },
            { '?', 'M' },
            { '\u0E12', '<' },
            { '\u0E2C', '>' },
            { '\u0E26', '?' }
        };

        public static string SwapKeyboardLayout(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text;
            }

            StringBuilder sb = new StringBuilder(text.Length);
            for (int i = 0; i < text.Length; i++)
            {
                char ch = text[i];
                char mapped;
                if (ch >= 0x0E01 && ch <= 0x0E5B && ThToEn.TryGetValue(ch, out mapped))
                {
                    sb.Append(mapped);
                }
                else if (EnToTh.TryGetValue(ch, out mapped))
                {
                    sb.Append(mapped);
                }
                else
                {
                    sb.Append(ch);
                }
            }
            return sb.ToString();
        }
    }

    internal static class NativeWin32
    {
        public const int WM_HOTKEY = 0x0312;
        public const uint WM_LUNO_FIX_LANGUAGE = 0x804C; // WM_APP + 'L'
        public const uint MOD_CONTROL = 0x0002;
        public const uint MOD_SHIFT = 0x0004;
        public const uint MOD_NOREPEAT = 0x4000;
        public const uint VK_L = 0x4C;

        private const uint INPUT_KEYBOARD = 1;
        private const uint KEYEVENTF_KEYUP = 0x0002;
        private const ushort VK_SHIFT = 0x10;
        private const ushort VK_CONTROL = 0x11;
        private const ushort VK_MENU = 0x12;
        private const ushort VK_LSHIFT = 0xA0;
        private const ushort VK_RSHIFT = 0xA1;
        private const ushort VK_LCONTROL = 0xA2;
        private const ushort VK_RCONTROL = 0xA3;
        private const ushort VK_LMENU = 0xA4;
        private const ushort VK_RMENU = 0xA5;
        private const ushort VK_L_USHORT = 0x4C;
        private const ushort VK_C = 0x43;
        private const ushort VK_V = 0x56;

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern uint GetClipboardSequenceNumber();

        [DllImport("user32.dll")]
        public static extern short GetAsyncKeyState(int vKey);

        [DllImport("user32.dll")]
        public static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [StructLayout(LayoutKind.Sequential)]
        public struct INPUT
        {
            public uint type;
            public InputUnion u;
        }

        [StructLayout(LayoutKind.Explicit)]
        public struct InputUnion
        {
            [FieldOffset(0)] public MOUSEINPUT mi;
            [FieldOffset(0)] public KEYBDINPUT ki;
            [FieldOffset(0)] public HARDWAREINPUT hi;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct HARDWAREINPUT
        {
            public uint uMsg;
            public ushort wParamL;
            public ushort wParamH;
        }

        public static int InputStructSize()
        {
            return Marshal.SizeOf(typeof(INPUT));
        }

        private static bool IsKeyDown(int vk)
        {
            return (GetAsyncKeyState(vk) & 0x8000) != 0;
        }

        private static INPUT MakeKey(ushort vk, bool keyUp)
        {
            INPUT inp = new INPUT();
            inp.type = INPUT_KEYBOARD;
            inp.u.ki.wVk = vk;
            inp.u.ki.wScan = (ushort)MapVirtualKey(vk, 0);
            inp.u.ki.dwFlags = keyUp ? KEYEVENTF_KEYUP : 0;
            inp.u.ki.time = 0;
            inp.u.ki.dwExtraInfo = IntPtr.Zero;
            return inp;
        }

        public static void WaitForModifiersRelease(int maxWaitMs)
        {
            int[] keys = new int[]
            {
                VK_LSHIFT, VK_RSHIFT, VK_SHIFT,
                VK_LCONTROL, VK_RCONTROL, VK_CONTROL,
                VK_LMENU, VK_RMENU, VK_MENU,
                VK_L_USHORT
            };
            int elapsed = 0;
            while (elapsed < maxWaitMs)
            {
                bool anyDown = false;
                for (int i = 0; i < keys.Length; i++)
                {
                    if (IsKeyDown(keys[i]))
                    {
                        anyDown = true;
                        break;
                    }
                }
                if (!anyDown) break;
                Thread.Sleep(10);
                elapsed += 10;
            }
        }

        private static void ReleaseConflictingModifiers()
        {
            ushort[] toRelease = new ushort[]
            {
                VK_LSHIFT, VK_RSHIFT, VK_SHIFT,
                VK_LMENU, VK_RMENU, VK_MENU,
                VK_L_USHORT,
                VK_LCONTROL, VK_RCONTROL, VK_CONTROL
            };
            List<INPUT> list = new List<INPUT>();
            for (int i = 0; i < toRelease.Length; i++)
            {
                if (IsKeyDown(toRelease[i]))
                {
                    list.Add(MakeKey(toRelease[i], true));
                }
            }
            if (list.Count > 0)
            {
                SendInput((uint)list.Count, list.ToArray(), Marshal.SizeOf(typeof(INPUT)));
                Thread.Sleep(15);
            }
        }

        private static void SendCtrlKey(ushort vk)
        {
            ReleaseConflictingModifiers();
            INPUT[] inputs = new INPUT[]
            {
                MakeKey(VK_LCONTROL, false),
                MakeKey(vk, false),
                MakeKey(vk, true),
                MakeKey(VK_LCONTROL, true)
            };
            SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        public static bool CopySelection(int releaseWaitMs, int clipboardWaitMs)
        {
            WaitForModifiersRelease(releaseWaitMs);
            uint seqBefore = GetClipboardSequenceNumber();
            SendCtrlKey(VK_C);
            int elapsed = 0;
            while (elapsed < clipboardWaitMs)
            {
                if (GetClipboardSequenceNumber() != seqBefore)
                {
                    Thread.Sleep(15);
                    return true;
                }
                Thread.Sleep(10);
                elapsed += 10;
            }
            return false;
        }

        public static void PasteClipboard()
        {
            SendCtrlKey(VK_V);
        }
    }

    internal class ClipboardSnapshot
    {
        public bool HadContent;
        public string Text;
        public string Html;
        public string Rtf;
        public Bitmap Image;
        public StringCollection FileDropList;

        public void Dispose()
        {
            if (Image != null)
            {
                Image.Dispose();
                Image = null;
            }
        }
    }

    internal sealed class HotkeyWindow : NativeWindow, IDisposable
    {
        private readonly Action _onHotkey;

        public HotkeyWindow(Action onHotkey)
        {
            _onHotkey = onHotkey;
            CreateParams cp = new CreateParams();
            cp.Caption = "LunoFixLanguageHotkeySink";
            CreateHandle(cp);
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeWin32.WM_HOTKEY && _onHotkey != null)
            {
                _onHotkey();
                return;
            }
            base.WndProc(ref m);
        }

        public void Dispose()
        {
            if (Handle != IntPtr.Zero)
            {
                DestroyHandle();
            }
        }
    }

    internal sealed class HelperTrayContext : ApplicationContext
    {
        private const int HOTKEY_ID = 0x4C4E; // "LN"
        private const string STOP_EVENT_NAME = "Local\\LunoNote.FixLanguageHelper.Stop";
        private const string RELOAD_EVENT_NAME = "Local\\LunoNote.FixLanguageHelper.Reload";

        private readonly string _configPath;
        private readonly string _statusPath;
        private readonly HotkeyWindow _hotkeyWindow;
        private readonly NotifyIcon _trayIcon;
        private readonly Control _uiInvoker;
        private readonly ToolStripMenuItem _headerItem;
        private readonly ToolStripMenuItem _toggleItem;
        private readonly ToolStripMenuItem _openAppItem;
        private readonly ToolStripMenuItem _exitItem;
        private readonly EventWaitHandle _stopEvent;
        private readonly EventWaitHandle _reloadEvent;
        private readonly Thread _signalThread;
        private FileSystemWatcher _watcher;
        private System.Windows.Forms.Timer _reloadDebounceTimer;
        private System.Windows.Forms.Timer _clipboardRestoreTimer;
        private ClipboardSnapshot _pendingRestoreSnapshot;
        private string _pendingRestoreExpectedText;

        private HelperConfig _config = new HelperConfig();
        private bool _hotkeyRegistered = false;
        private bool _isProcessing = false;
        private long _lastCompletedTicks = 0;
        private volatile bool _exiting = false;

        public HelperTrayContext(string configPath)
        {
            _stopEvent = new EventWaitHandle(false, EventResetMode.AutoReset, STOP_EVENT_NAME);
            _reloadEvent = new EventWaitHandle(false, EventResetMode.AutoReset, RELOAD_EVENT_NAME);

            _configPath = configPath;
            string dir = Path.GetDirectoryName(configPath);
            _statusPath = Path.Combine(string.IsNullOrEmpty(dir) ? Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) : dir, "fix-language-helper-status.json");

            _uiInvoker = new Control();
            IntPtr _ = _uiInvoker.Handle; // Force handle creation on UI thread

            _hotkeyWindow = new HotkeyWindow(HandleHotkeyPressed);

            _headerItem = new ToolStripMenuItem("Luno Fix Language (Ctrl+Shift+L)");
            _headerItem.Enabled = false;
            _headerItem.Font = new Font(_headerItem.Font, FontStyle.Bold);

            _toggleItem = new ToolStripMenuItem("Enabled (Ctrl+Shift+L)");
            _toggleItem.Click += OnToggleEnabledClick;

            _openAppItem = new ToolStripMenuItem("Open Luno Note");
            _openAppItem.Click += OnOpenAppClick;

            _exitItem = new ToolStripMenuItem("Exit");
            _exitItem.Click += OnExitClick;

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add(_headerItem);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(_toggleItem);
            menu.Items.Add(_openAppItem);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(_exitItem);

            Icon icon = null;
            try
            {
                icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
                icon = SystemIcons.Application;
            }

            _trayIcon = new NotifyIcon();
            _trayIcon.Icon = icon ?? SystemIcons.Application;
            _trayIcon.ContextMenuStrip = menu;
            _trayIcon.Visible = true;
            _trayIcon.DoubleClick += OnOpenAppClick;

            LoadConfigAndApply();
            StartConfigWatcher();

            _signalThread = new Thread(SignalWatchLoop);
            _signalThread.IsBackground = true;
            _signalThread.Start();
        }

        private void SignalWatchLoop()
        {
            WaitHandle[] handles = new WaitHandle[] { _stopEvent, _reloadEvent };
            while (!_exiting)
            {
                try
                {
                    int idx = WaitHandle.WaitAny(handles, 1000);
                    if (_exiting) break;
                    if (idx == 0)
                    {
                        MarshalToUi(ShutdownCleanly);
                        break;
                    }
                    else if (idx == 1)
                    {
                        MarshalToUi(LoadConfigAndApply);
                    }
                }
                catch
                {
                    break;
                }
            }
        }

        private void MarshalToUi(Action action)
        {
            if (_exiting || _uiInvoker == null || _uiInvoker.IsDisposed || !_uiInvoker.IsHandleCreated)
            {
                return;
            }
            try
            {
                _uiInvoker.BeginInvoke(action);
            }
            catch
            {
                // Ignore invoke during shutdown
            }
        }

        private void StartConfigWatcher()
        {
            try
            {
                string dir = Path.GetDirectoryName(_configPath);
                string file = Path.GetFileName(_configPath);
                if (string.IsNullOrEmpty(dir) || string.IsNullOrEmpty(file)) return;
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                _watcher = new FileSystemWatcher(dir, file);
                _watcher.NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.CreationTime | NotifyFilters.FileName | NotifyFilters.Size;
                _watcher.Changed += OnConfigFileChanged;
                _watcher.Created += OnConfigFileChanged;
                _watcher.Renamed += OnConfigFileChanged;
                _watcher.EnableRaisingEvents = true;
            }
            catch
            {
                // Watcher is optional since --reload event is also supported
            }
        }

        private void OnConfigFileChanged(object sender, FileSystemEventArgs e)
        {
            MarshalToUi(ScheduleDebouncedReload);
        }

        private void ScheduleDebouncedReload()
        {
            if (_exiting) return;
            if (_reloadDebounceTimer == null)
            {
                _reloadDebounceTimer = new System.Windows.Forms.Timer();
                _reloadDebounceTimer.Interval = 120;
                _reloadDebounceTimer.Tick += delegate
                {
                    _reloadDebounceTimer.Stop();
                    LoadConfigAndApply();
                };
            }
            _reloadDebounceTimer.Stop();
            _reloadDebounceTimer.Start();
        }

        private HelperConfig ReadConfigFile()
        {
            if (!File.Exists(_configPath))
            {
                return new HelperConfig();
            }

            for (int attempt = 0; attempt < 3; attempt++)
            {
                try
                {
                    byte[] bytes = File.ReadAllBytes(_configPath);
                    using (MemoryStream ms = new MemoryStream(bytes))
                    {
                        DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(HelperConfig));
                        HelperConfig parsed = serializer.ReadObject(ms) as HelperConfig;
                        if (parsed != null)
                        {
                            return parsed;
                        }
                    }
                }
                catch
                {
                    Thread.Sleep(35);
                }
            }
            return _config ?? new HelperConfig();
        }

        private void LoadConfigAndApply()
        {
            if (_exiting) return;
            _config = ReadConfigFile();
            ApplyHotkeyRegistration(_config.Enabled);
            RefreshTrayUi();
            WriteStatusFile(true);
        }

        private void ApplyHotkeyRegistration(bool shouldEnable)
        {
            if (!shouldEnable)
            {
                if (_hotkeyRegistered)
                {
                    NativeWin32.UnregisterHotKey(_hotkeyWindow.Handle, HOTKEY_ID);
                    _hotkeyRegistered = false;
                }
                return;
            }

            if (!_hotkeyRegistered)
            {
                _hotkeyRegistered = NativeWin32.RegisterHotKey(
                    _hotkeyWindow.Handle,
                    HOTKEY_ID,
                    NativeWin32.MOD_CONTROL | NativeWin32.MOD_SHIFT | NativeWin32.MOD_NOREPEAT,
                    NativeWin32.VK_L
                );
            }
        }

        private string GetLabel(Func<HelperLabels, string> selector, string fallbackEn, string fallbackTh)
        {
            if (_config != null && _config.Labels != null)
            {
                string val = selector(_config.Labels);
                if (!string.IsNullOrEmpty(val)) return val;
            }
            bool isTh = _config != null && string.Equals(_config.Language, "th", StringComparison.OrdinalIgnoreCase);
            return isTh ? fallbackTh : fallbackEn;
        }

        private void RefreshTrayUi()
        {
            string tooltip = _config.Enabled
                ? GetLabel(l => l.TrayTooltipActive, "Luno Fix Language: Active (Ctrl+Shift+L)", "Luno \u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32: \u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19 (Ctrl+Shift+L)")
                : GetLabel(l => l.TrayTooltipPaused, "Luno Fix Language: Paused (Ctrl+Shift+L)", "Luno \u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32: \u0E2B\u0E22\u0E38\u0E14\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 (Ctrl+Shift+L)");

            // NotifyIcon.Text max length is 63 chars in .NET Framework
            if (tooltip.Length > 63) tooltip = tooltip.Substring(0, 63);
            _trayIcon.Text = tooltip;

            _headerItem.Text = GetLabel(l => l.MenuHeader, "Luno Fix Language (Ctrl+Shift+L)", "Luno \u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32 (Ctrl+Shift+L)");
            _toggleItem.Text = GetLabel(l => l.MenuEnabled, "Enabled (Ctrl+Shift+L)", "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 (Ctrl+Shift+L)");
            _toggleItem.Checked = _config.Enabled && _hotkeyRegistered;
            _openAppItem.Text = GetLabel(l => l.MenuOpenApp, "Open Luno Note", "\u0E40\u0E1B\u0E34\u0E14 Luno Note");
            _openAppItem.Visible = CanLaunchLunoApp();
            _exitItem.Text = GetLabel(l => l.MenuExit, "Exit Fix Language Helper", "\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E0A\u0E48\u0E27\u0E22\u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32");
        }

        private bool CanLaunchLunoApp()
        {
            if (_config == null || string.IsNullOrEmpty(_config.LunoAppPath)) return false;
            try
            {
                return _config.LunoAppPath.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) && File.Exists(_config.LunoAppPath);
            }
            catch
            {
                return false;
            }
        }

        private void WriteStatusFile(bool running)
        {
            try
            {
                string dir = Path.GetDirectoryName(_statusPath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                HelperStatus status = new HelperStatus();
                status.Running = running;
                status.Pid = Process.GetCurrentProcess().Id;
                status.Enabled = _config != null && _config.Enabled;
                status.Registered = running && _hotkeyRegistered;
                status.UpdatedAt = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;

                using (MemoryStream ms = new MemoryStream())
                {
                    DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(HelperStatus));
                    serializer.WriteObject(ms, status);
                    File.WriteAllBytes(_statusPath, ms.ToArray());
                }
            }
            catch
            {
                // Non-fatal
            }
        }

        private void OnToggleEnabledClick(object sender, EventArgs e)
        {
            _config.Enabled = !_config.Enabled;
            ApplyHotkeyRegistration(_config.Enabled);
            RefreshTrayUi();
            WriteStatusFile(true);
            if (_config.Enabled && !_hotkeyRegistered)
            {
                string title = GetLabel(l => l.Title, "Fix language", "\u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32");
                string conflict = GetLabel(l => l.ConflictBalloon, "Ctrl+Shift+L is currently used by another app.", "\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14 Ctrl+Shift+L \u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E42\u0E14\u0E22\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E2D\u0E37\u0E48\u0E19\u0E2D\u0E22\u0E39\u0E48");
                _trayIcon.ShowBalloonTip(2500, title, conflict, ToolTipIcon.Warning);
            }
        }

        private void OnOpenAppClick(object sender, EventArgs e)
        {
            if (!CanLaunchLunoApp()) return;
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(_config.LunoAppPath);
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
            catch
            {
                // Ignore launch failure
            }
        }

        private void OnExitClick(object sender, EventArgs e)
        {
            ShutdownCleanly();
        }

        private void HandleHotkeyPressed()
        {
            if (_exiting || !_config.Enabled || _isProcessing) return;
            long nowTicks = Stopwatch.GetTimestamp();
            long minGapTicks = (long)(Stopwatch.Frequency * 0.15);
            if (_lastCompletedTicks > 0 && (nowTicks - _lastCompletedTicks) < minGapTicks)
            {
                return;
            }

            _isProcessing = true;
            try
            {
                IntPtr fgHwnd = NativeWin32.GetForegroundWindow();
                if (fgHwnd != IntPtr.Zero && IsLunoNoteForegroundWindow(fgHwnd))
                {
                    // Dispatch straight to Luno Note window with zero clipboard flicker
                    NativeWin32.PostMessage(fgHwnd, NativeWin32.WM_LUNO_FIX_LANGUAGE, IntPtr.Zero, IntPtr.Zero);
                    return;
                }

                RunExternalFixLanguage();
            }
            finally
            {
                _lastCompletedTicks = Stopwatch.GetTimestamp();
                _isProcessing = false;
            }
        }

        private bool IsLunoNoteForegroundWindow(IntPtr fgHwnd)
        {
            uint fgPid = 0;
            NativeWin32.GetWindowThreadProcessId(fgHwnd, out fgPid);
            if (fgPid == 0) return false;

            if (_config != null && _config.LunoPid > 0 && fgPid == (uint)_config.LunoPid)
            {
                return true;
            }

            try
            {
                using (Process proc = Process.GetProcessById((int)fgPid))
                {
                    if (string.Equals(proc.ProcessName, "Luno Note", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
            }
            catch
            {
                // Ignore access denied / exited process
            }

            return false;
        }

        private void RunExternalFixLanguage()
        {
            // Cancel any pending restore from an earlier rapid trigger
            CancelPendingClipboardRestore();

            ClipboardSnapshot snapshot = CaptureClipboardSnapshot();
            bool copied = NativeWin32.CopySelection(400, 300);
            if (!copied)
            {
                snapshot.Dispose();
                ShowSelectTextBalloon();
                return;
            }

            string selectedText = ReadClipboardUnicodeText();
            if (string.IsNullOrEmpty(selectedText) || selectedText.Trim().Length == 0)
            {
                RestoreClipboardSnapshot(snapshot, null);
                snapshot.Dispose();
                ShowSelectTextBalloon();
                return;
            }

            string convertedText = ThaiKeyboardMapper.SwapKeyboardLayout(selectedText);
            if (string.Equals(convertedText, selectedText, StringComparison.Ordinal))
            {
                RestoreClipboardSnapshot(snapshot, null);
                snapshot.Dispose();
                return;
            }

            if (!WriteClipboardUnicodeText(convertedText))
            {
                RestoreClipboardSnapshot(snapshot, null);
                snapshot.Dispose();
                return;
            }

            Thread.Sleep(20);
            NativeWin32.PasteClipboard();

            ScheduleClipboardRestore(snapshot, convertedText);
        }

        private void ShowSelectTextBalloon()
        {
            string title = GetLabel(l => l.Title, "Fix language", "\u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32");
            string body = GetLabel(l => l.SelectTextFirst, "Select text before fixing language.", "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E04\u0E23\u0E2D\u0E1A\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E0B\u0E48\u0E2D\u0E21\u0E20\u0E32\u0E29\u0E32");
            _trayIcon.ShowBalloonTip(2200, title, body, ToolTipIcon.Info);
        }

        private static ClipboardSnapshot CaptureClipboardSnapshot()
        {
            ClipboardSnapshot snap = new ClipboardSnapshot();
            for (int attempt = 0; attempt < 3; attempt++)
            {
                try
                {
                    if (Clipboard.ContainsText(TextDataFormat.UnicodeText))
                    {
                        snap.Text = Clipboard.GetText(TextDataFormat.UnicodeText);
                        snap.HadContent = true;
                    }
                    if (Clipboard.ContainsData(DataFormats.Html))
                    {
                        snap.Html = Clipboard.GetData(DataFormats.Html) as string;
                        if (!string.IsNullOrEmpty(snap.Html)) snap.HadContent = true;
                    }
                    if (Clipboard.ContainsData(DataFormats.Rtf))
                    {
                        snap.Rtf = Clipboard.GetData(DataFormats.Rtf) as string;
                        if (!string.IsNullOrEmpty(snap.Rtf)) snap.HadContent = true;
                    }
                    if (Clipboard.ContainsImage())
                    {
                        using (Image img = Clipboard.GetImage())
                        {
                            if (img != null)
                            {
                                snap.Image = new Bitmap(img);
                                snap.HadContent = true;
                            }
                        }
                    }
                    if (Clipboard.ContainsFileDropList())
                    {
                        StringCollection files = Clipboard.GetFileDropList();
                        if (files != null && files.Count > 0)
                        {
                            snap.FileDropList = new StringCollection();
                            foreach (string f in files) snap.FileDropList.Add(f);
                            snap.HadContent = true;
                        }
                    }
                    return snap;
                }
                catch
                {
                    Thread.Sleep(20);
                }
            }
            return snap;
        }

        private static string ReadClipboardUnicodeText()
        {
            for (int attempt = 0; attempt < 4; attempt++)
            {
                try
                {
                    if (Clipboard.ContainsText(TextDataFormat.UnicodeText))
                    {
                        return Clipboard.GetText(TextDataFormat.UnicodeText);
                    }
                    if (Clipboard.ContainsText())
                    {
                        return Clipboard.GetText();
                    }
                    return "";
                }
                catch
                {
                    Thread.Sleep(20);
                }
            }
            return "";
        }

        private static bool WriteClipboardUnicodeText(string text)
        {
            for (int attempt = 0; attempt < 4; attempt++)
            {
                try
                {
                    Clipboard.SetText(text, TextDataFormat.UnicodeText);
                    return true;
                }
                catch
                {
                    Thread.Sleep(20);
                }
            }
            return false;
        }

        private static void RestoreClipboardSnapshot(ClipboardSnapshot snapshot, string expectedCurrentText)
        {
            if (snapshot == null) return;
            for (int attempt = 0; attempt < 3; attempt++)
            {
                try
                {
                    if (expectedCurrentText != null)
                    {
                        string current = Clipboard.ContainsText(TextDataFormat.UnicodeText)
                            ? Clipboard.GetText(TextDataFormat.UnicodeText)
                            : null;
                        if (!string.Equals(current, expectedCurrentText, StringComparison.Ordinal))
                        {
                            return;
                        }
                    }

                    if (!snapshot.HadContent)
                    {
                        Clipboard.Clear();
                        return;
                    }

                    DataObject dataObj = new DataObject();
                    bool hasAny = false;
                    if (!string.IsNullOrEmpty(snapshot.Text))
                    {
                        dataObj.SetData(DataFormats.UnicodeText, true, snapshot.Text);
                        hasAny = true;
                    }
                    if (!string.IsNullOrEmpty(snapshot.Html))
                    {
                        dataObj.SetData(DataFormats.Html, true, snapshot.Html);
                        hasAny = true;
                    }
                    if (!string.IsNullOrEmpty(snapshot.Rtf))
                    {
                        dataObj.SetData(DataFormats.Rtf, true, snapshot.Rtf);
                        hasAny = true;
                    }
                    if (snapshot.Image != null)
                    {
                        dataObj.SetImage(snapshot.Image);
                        hasAny = true;
                    }
                    if (snapshot.FileDropList != null && snapshot.FileDropList.Count > 0)
                    {
                        dataObj.SetFileDropList(snapshot.FileDropList);
                        hasAny = true;
                    }

                    if (hasAny)
                    {
                        Clipboard.SetDataObject(dataObj, true);
                    }
                    else
                    {
                        Clipboard.Clear();
                    }
                    return;
                }
                catch
                {
                    Thread.Sleep(20);
                }
            }
        }

        private void CancelPendingClipboardRestore()
        {
            if (_clipboardRestoreTimer != null)
            {
                _clipboardRestoreTimer.Stop();
            }
            if (_pendingRestoreSnapshot != null)
            {
                _pendingRestoreSnapshot.Dispose();
                _pendingRestoreSnapshot = null;
            }
            _pendingRestoreExpectedText = null;
        }

        private void ScheduleClipboardRestore(ClipboardSnapshot snapshot, string expectedText)
        {
            _pendingRestoreSnapshot = snapshot;
            _pendingRestoreExpectedText = expectedText;

            if (_clipboardRestoreTimer == null)
            {
                _clipboardRestoreTimer = new System.Windows.Forms.Timer();
                _clipboardRestoreTimer.Interval = 240;
                _clipboardRestoreTimer.Tick += delegate
                {
                    _clipboardRestoreTimer.Stop();
                    ClipboardSnapshot snap = _pendingRestoreSnapshot;
                    string expected = _pendingRestoreExpectedText;
                    _pendingRestoreSnapshot = null;
                    _pendingRestoreExpectedText = null;
                    if (snap != null)
                    {
                        RestoreClipboardSnapshot(snap, expected);
                        snap.Dispose();
                    }
                };
            }
            _clipboardRestoreTimer.Stop();
            _clipboardRestoreTimer.Start();
        }

        private void ShutdownCleanly()
        {
            if (_exiting) return;
            _exiting = true;

            CancelPendingClipboardRestore();
            if (_reloadDebounceTimer != null)
            {
                _reloadDebounceTimer.Stop();
                _reloadDebounceTimer.Dispose();
                _reloadDebounceTimer = null;
            }
            if (_clipboardRestoreTimer != null)
            {
                _clipboardRestoreTimer.Stop();
                _clipboardRestoreTimer.Dispose();
                _clipboardRestoreTimer = null;
            }
            if (_watcher != null)
            {
                _watcher.EnableRaisingEvents = false;
                _watcher.Dispose();
                _watcher = null;
            }
            if (_hotkeyRegistered)
            {
                NativeWin32.UnregisterHotKey(_hotkeyWindow.Handle, HOTKEY_ID);
                _hotkeyRegistered = false;
            }
            WriteStatusFile(false);
            if (_trayIcon != null)
            {
                _trayIcon.Visible = false;
                _trayIcon.Dispose();
            }
            _hotkeyWindow.Dispose();
            _uiInvoker.Dispose();
            try { _stopEvent.Set(); } catch { }
            _stopEvent.Close();
            _reloadEvent.Close();
            ExitThread();
        }
    }

    internal static class Program
    {
        private const string MUTEX_NAME = "Local\\LunoNote.FixLanguageHelper.Mutex";
        private const string STOP_EVENT_NAME = "Local\\LunoNote.FixLanguageHelper.Stop";
        private const string RELOAD_EVENT_NAME = "Local\\LunoNote.FixLanguageHelper.Reload";
        private const string AUTOSTART_REG_PATH = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        private const string AUTOSTART_VALUE_NAME = "LunoFixLanguageHelper";

        [STAThread]
        private static int Main(string[] args)
        {
            string configPath = GetDefaultConfigPath();
            string command = null;
            string swapBase64Arg = null;

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (string.Equals(arg, "--config", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
                {
                    configPath = args[++i];
                }
                else if (string.Equals(arg, "--swap-base64", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
                {
                    command = "--swap-base64";
                    swapBase64Arg = args[++i];
                }
                else if (arg.StartsWith("--", StringComparison.Ordinal))
                {
                    command = arg.ToLowerInvariant();
                }
            }

            if (command == "--selftest")
            {
                return RunSelfTest();
            }
            if (command == "--swap-base64")
            {
                return RunSwapBase64(swapBase64Arg);
            }
            if (command == "--status")
            {
                return IsHelperRunning() ? 0 : 1;
            }
            if (command == "--stop")
            {
                return SignalStopAndWait();
            }
            if (command == "--reload")
            {
                return SignalReload();
            }
            if (command == "--install-autostart")
            {
                return InstallAutoStart(configPath);
            }
            if (command == "--uninstall-autostart")
            {
                return UninstallAutoStart();
            }
            if (command == "--check-autostart")
            {
                return CheckAutoStart();
            }

            bool createdNew = false;
            using (Mutex mutex = new Mutex(true, MUTEX_NAME, out createdNew))
            {
                if (!createdNew)
                {
                    SignalReload();
                    return 0;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                using (HelperTrayContext ctx = new HelperTrayContext(configPath))
                {
                    Application.Run(ctx);
                }
                return 0;
            }
        }

        private static string GetDefaultConfigPath()
        {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            return Path.Combine(Path.Combine(appData, "luno-note"), "fix-language-helper.json");
        }

        private static int RunSelfTest()
        {
            int expectedSize = IntPtr.Size == 8 ? 40 : 28;
            int actualSize = NativeWin32.InputStructSize();
            if (actualSize != expectedSize)
            {
                Console.Error.WriteLine("INPUT struct size mismatch: expected " + expectedSize + ", got " + actualSize);
                return 1;
            }

            string sample = "l;ylfumujouj \u0E18\u0E49\u0E1F\u0E23\u0E2A\u0E1F\u0E37\u0E01";
            string expected = "\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48 Thailand";
            string swapped = ThaiKeyboardMapper.SwapKeyboardLayout(sample);
            if (!string.Equals(swapped, expected, StringComparison.Ordinal))
            {
                Console.Error.WriteLine("Swap mismatch");
                return 1;
            }

            string roundTrip = ThaiKeyboardMapper.SwapKeyboardLayout(swapped);
            if (!string.Equals(roundTrip, sample, StringComparison.Ordinal))
            {
                Console.Error.WriteLine("Round-trip mismatch");
                return 1;
            }

            Console.Out.WriteLine("OK SIZE=" + actualSize);
            return 0;
        }

        private static int RunSwapBase64(string base64Input)
        {
            try
            {
                byte[] inputBytes = Convert.FromBase64String(base64Input ?? "");
                string input = Encoding.UTF8.GetString(inputBytes);
                string output = ThaiKeyboardMapper.SwapKeyboardLayout(input);
                string outputBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(output));
                Console.Out.Write(outputBase64);
                return 0;
            }
            catch
            {
                return 1;
            }
        }

        private static bool IsHelperRunning()
        {
            try
            {
                using (Mutex existing = Mutex.OpenExisting(MUTEX_NAME))
                {
                    return existing != null;
                }
            }
            catch
            {
                return false;
            }
        }

        private static int SignalStopAndWait()
        {
            bool signaled = false;
            for (int attempt = 0; attempt < 12; attempt++)
            {
                try
                {
                    using (EventWaitHandle stopEvt = EventWaitHandle.OpenExisting(STOP_EVENT_NAME))
                    {
                        stopEvt.Set();
                        signaled = true;
                        break;
                    }
                }
                catch
                {
                    if (!IsHelperRunning()) return 0;
                    Thread.Sleep(50);
                }
            }

            if (!signaled && !IsHelperRunning()) return 0;

            for (int i = 0; i < 40; i++)
            {
                if (!IsHelperRunning()) return 0;
                Thread.Sleep(50);
            }
            return 0;
        }

        private static int SignalReload()
        {
            try
            {
                using (EventWaitHandle reloadEvt = EventWaitHandle.OpenExisting(RELOAD_EVENT_NAME))
                {
                    reloadEvt.Set();
                }
            }
            catch
            {
                // Not running
            }
            return 0;
        }

        private static int InstallAutoStart(string configPath)
        {
            try
            {
                string exePath = Application.ExecutablePath;
                string cmd = "\"" + exePath + "\" --config \"" + configPath + "\"";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(AUTOSTART_REG_PATH))
                {
                    if (key == null) return 1;
                    key.SetValue(AUTOSTART_VALUE_NAME, cmd, RegistryValueKind.String);
                }
                return 0;
            }
            catch
            {
                return 1;
            }
        }

        private static int UninstallAutoStart()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(AUTOSTART_REG_PATH, true))
                {
                    if (key != null)
                    {
                        key.DeleteValue(AUTOSTART_VALUE_NAME, false);
                    }
                }
                return 0;
            }
            catch
            {
                return 1;
            }
        }

        private static int CheckAutoStart()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(AUTOSTART_REG_PATH, false))
                {
                    if (key == null) return 1;
                    string val = key.GetValue(AUTOSTART_VALUE_NAME) as string;
                    return !string.IsNullOrEmpty(val) ? 0 : 1;
                }
            }
            catch
            {
                return 1;
            }
        }
    }
}
