@echo off
title Discord Bot Launcher

REM --- Step 1: Register commands ---
echo Registering commands...
start cmd /k "node commands.js"

REM --- Step 2: Start the bot server ---
echo Starting bot server...
start cmd /k "node app.js"

REM --- Step 3: Start ngrok ---
echo Starting ngrok...
start cmd /k "ngrok http 3000"

echo All processes started.
pause
