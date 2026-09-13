@echo off
title TVN Recycling - Web Server & Public Tunnel
cd /d C:\tvn-phelieu

echo ============================================================
echo   KHOI DONG HE THONG WEBSITE THU MUA PHE LIEU TVN
echo ============================================================
echo [1/2] Dang khoi dong Node.js Server (Port 3000 & Port 80)...
start "TVN Node Server" cmd /k "node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Dang tao duong truyen Internet Public qua Cloudflare...
start "Cloudflare Tunnel" cmd /k ".\cloudflared.exe tunnel --url http://127.0.0.1:3000"

echo.
echo ============================================================
echo   HE THONG DA DUOC KHOI DONG THANH CONG!
echo   Xem link public trycloudflare.com tren cua so Cloudflare!
echo ============================================================
pause
