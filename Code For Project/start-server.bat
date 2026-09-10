@echo off
setlocal
cd /d "%~dp0"

if exist "%~dp0admin-config.bat" call "%~dp0admin-config.bat"

py -3 --version >nul 2>nul
if %errorlevel% equ 0 (
  py -3 server.py
  goto :end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
  python server.py
  goto :end
)

echo Python 3.10 or newer is required.
pause

:end
endlocal
