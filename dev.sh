#!/bin/bash

echo "Starting backend on http://localhost:8080"
cd server && go run server.go &

echo "Starting frontend on http://localhost:3000"
cd client && pnpm run dev &

wait