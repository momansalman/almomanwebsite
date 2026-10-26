@echo off
title Push AL-MOMAN Website to GitHub
color 0B
echo ========================================================
echo   AL-MOMAN FROZEN FOODS - GITHUB UPLOAD / PUSH
echo   Target Repo: https://github.com/momansalman/almomanwebsite.git
echo ========================================================
echo.
echo Pushing codebase to branch main...
echo (Agar browser window khulay to 'Sign in with your browser' par click kar k authorize kar dein)
echo.
cd /d "d:\Al Moman Frozen Foods"
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! Website GitHub par kamyabi se push ho chuki hai!
    echo   Repo Link: https://github.com/momansalman/almomanwebsite.git
    echo ========================================================
) else (
    echo ========================================================
    echo   Push mein issue aya. Please check credentials.
    echo ========================================================
)
echo.
pause
