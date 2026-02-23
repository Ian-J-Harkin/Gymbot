@echo off
setlocal enabledelayedexpansion

echo Starting GymBot Full Stack (API + Admin)...
echo Press Ctrl+C to stop both services.
echo.

:: Run the dev script
call npm run dev

:: If the command above exits, it means either user stopped it or it failed
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: One or more services failed to start or crashed unexpectedly.
    echo Please check the logs above for port conflicts or syntax errors.
    pause
) else (
    echo.
    echo 👋 Services stopped gracefully.
)
