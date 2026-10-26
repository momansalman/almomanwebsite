@echo off
title Al Moman Frozen Foods - Local Server
color 0A
echo ========================================================
echo   AL MOMAN FROZEN FOODS - STARTING WEBSITE SERVER...
echo ========================================================
echo.
echo   Customer Website : http://localhost:3000
echo   Admin Portal     : http://localhost:3000/admin/login
echo.
echo   Do not close this black window while using the site.
echo ========================================================
cd /d "d:\Al Moman Frozen Foods"
start "" "http://localhost:3000"
start "" "http://localhost:3000/admin/login"
npm run dev
pause
