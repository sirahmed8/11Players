@echo off
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0stop-dev.ps1"
echo 11Players Dev Server stopped.
timeout /t 2 >nul
