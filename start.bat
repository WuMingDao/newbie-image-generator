@echo off
echo Starting ComfyUI Image Generator...
echo.
echo Make sure ComfyUI is running on http://127.0.0.1:8188
echo.
cd /d "%~dp0"
backend.exe
pause
