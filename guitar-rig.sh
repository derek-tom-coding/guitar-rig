#!/bin/bash

# ============ Run the application env ============

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎸 Starting Guitar Rig Development Environment${NC}\n"

cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

if [ ! -d "server" ]; then
    echo -e "${YELLOW}Error: server directory not found${NC}"
    exit 1
fi

if [ ! -d "client" ]; then
    echo -e "${YELLOW}Error: client directory not found${NC}"
    exit 1
fi

# Start backend
echo -e "${GREEN}Starting Go backend on http://localhost:8080${NC}"
cd server
go run . > ../server.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo -e "${GREEN}Starting React frontend on http://localhost:5300${NC}"
cd client
pnpm dev > ../client.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Development servers running!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "Backend:   ${BLUE}http://localhost:8080${NC}"
echo -e "GraphQL:   ${BLUE}http://localhost:8080${NC}"
echo -e "\n${YELLOW}  Logs:${NC}"
echo -e "   Backend:  tail -f server.log"
echo -e "   Frontend: tail -f client.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Wait for both processes
wait
