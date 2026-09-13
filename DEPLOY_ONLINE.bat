@echo off
title TVN Recycling - Cap nhat Website Online
cd /d C:\tvn-phelieu

echo ============================================================
echo   DANG DONG GOI VA XUAT BAN WEBSITE LEN INTERNET
echo ============================================================
echo [1/2] Dong bo index_all_in_one.html...
node bundle.js

echo.
echo [2/2] Dang tai du lieu len https://thumuaphelieutvn.surge.sh...
call npx -y surge ./ thumuaphelieutvn.surge.sh

echo.
echo ============================================================
echo   DA CAP NHAT THANH CONG!
echo   Website truc tuyen: https://thumuaphelieutvn.surge.sh
echo ============================================================
pause
