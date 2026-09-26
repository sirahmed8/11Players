Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ""D:\Projects\11Players\scripts\launch-dev.ps1""", 0, False
