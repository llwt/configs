# DisableOfficeHotKeys
#
# Source: https://gist.github.com/darylwright/f3272846650b28906550a0454d7f4305
# 
# This script disables the hot keys that Windows 10 uses as a result of hijacking
# the Hyper key (Alt + Ctrl + Shift + Win/Super/Command), otherwise known as the
# Office key on some Microsoft devices. This is accomplished by stopping the
# explorer process and registering the hot keys before explorer has a chance to
# do so. The hot keys are then unregistered so that they are free for other use
# cases. This process is reversible via the -Reenable flag.
#
# References:
# - How-To Geek: https://www.howtogeek.com/445318/how-to-remap-the-office-key-on-your-keyboard/
# - OfficeKeyFix: https://github.com/anthonyheddings/OfficeKeyFix/
# - RegisterHotKey: https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerhotkey
# - UnregisterHotKey: https://docs.microsoft.com/en-ca/windows/win32/api/winuser/nf-winuser-unregisterhotkey
# - Pinvoke.net: http://pinvoke.net/default.aspx/user32/RegisterHotKey.html

param(
    [switch]$Reenable = $false
)

# Restore original Office hot key functionality with the -Reenable flag
if ($Reenable) {
    $regPath = "HKCU:\Software\Classes\ms-officeapp\Shell"

    if (Test-Path $regPath) { Remove-Item -Path $regPath -Recurse -Force }

    Stop-Process -Name "explorer" -Force
    Start-Process -FilePath "explorer"

    return
}

# Add the assembly reference that contains hot key registration methods
$signature = @"
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
    [DllImport("user32.dll")]
    public static extern int UnregisterHotKey(IntPtr hwnd, int id);
"@

$hotKeyRegister = Add-Type -MemberDefinition $signature -Name "HotKeyRegister" -Namespace "Win32Functions" -PassThru

if ($null -eq $hotKeyRegister) {
    Write-Host "Unable to import hot key registration module, exiting."
    return
}

# These keys map to W, T, Y, O, P, D, L, X, N, and Space, respectively.
$officeKeys = @(0x57, 0x54, 0x59, 0x4F, 0x50, 0x44, 0x4C, 0x58, 0x4E, 0x20)

# We need to stop the explorer process to register the office hot keys
Stop-Process -Name "explorer" -Force

$hyperKey = 0x1 + 0x2 + 0x4 + 0x8 # Hyper is Alt + Ctrl + Shift + Win
$noRepeat = 0x4000 # This modifier suppresses keyboard auto-repeat for hot keys

# Register hot keys while explorer isn't running
for ($i = 0; $i -lt $officeKeys.Count; $i++) {
    $hotKeyRegister::RegisterHotKey([System.IntPtr]::Zero, $i, $hyperKey -bor $noRepeat, $officeKeys[$i]) | Out-Null
}

# explorer won't be able to register Office hot keys on startup since they're already taken
Start-Process -FilePath "explorer"

# Wait long enough for explorer to finish attempting hot key registration
Start-Sleep -s 4

# Unregister the hot keys so that they're free to use in other applications
for ($i = 0; $i -lt $officeKeys.Count; $i++) {
    $hotKeyRegister::UnregisterHotKey([System.IntPtr]::Zero, $i) | Out-Null
}

# The hyper key itself needs to be unbound from the Office application via a registry entry
$regPath = "HKCU:\Software\Classes\ms-officeapp\Shell"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath | Out-Null }
$regPath = $regPath + "\Open"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath | Out-Null }
$regPath = $regPath + "\Command"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath | Out-Null }

New-ItemProperty -Path $regPath -Name "(Default)" -PropertyType String -Value "rundll32" | Out-Null