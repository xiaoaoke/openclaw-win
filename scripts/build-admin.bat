@echo off
cd /d "d:\daimacang\openclaw-gui"
echo === Starting electron-builder === >> build.log 2>&1
call npx electron-builder --win --config electron-builder.json5 >> build.log 2>&1
echo === EXIT CODE: %ERRORLEVEL% === >> build.log 2>&1
echo === BUILD DONE === >> build.log 2>&1
