@echo off
REM ==========================================================
REM  One-click push to GitLab
REM  Just double-click this file to upload all updates
REM ==========================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo   Pushing PouchCare updates to GitLab...
echo ============================================================
echo.

git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! All updates pushed to GitLab.
    echo ============================================================
    echo.
    echo You can view it at: https://gitlab.com/Pouchcare/OS
    echo.
) else (
    echo.
    echo ============================================================
    echo   Push failed. See error above.
    echo ============================================================
    echo.
    echo Common fixes:
    echo   1. Make sure you have internet connection
    echo   2. Make sure your SSH key is added to GitLab
    echo   3. Try: git push origin main --force  (only if safe)
    echo.
)

echo Press any key to close this window...
pause > nul
