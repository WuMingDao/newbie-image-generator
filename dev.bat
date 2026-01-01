@echo off
echo Starting development servers...
start "Backend" cmd /k "cd backend && cargo run"
start "Frontend" cmd /k "cd frontend && bun run dev"
