@echo off
echo ========================================
echo    AI Based Resume Screening and Ranking
echo ========================================
echo.
echo Starting Backend Server (with AI)...
start "Backend Server" cmd /k "cd backend && npm run dev"
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.
echo ========================================
echo    Services Starting...
echo ========================================
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:8080
echo.
echo AI Features Available:
echo - Resume Analysis with Gemini AI
echo - Job Description Improvement
echo - AI Interview Questions & Analysis
echo - Smart Candidate Ranking
echo.
echo Both servers are starting in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause > nul
