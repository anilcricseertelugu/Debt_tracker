@echo off
echo Starting Debt Tracker App...

echo Starting Backend Server (Port 3001)...
start cmd /k "cd server && npm start"

echo Starting Frontend Client (Port 5173)...
start cmd /k "cd client && npm run dev"

echo App is launching! Open http://localhost:5173 in your browser.
