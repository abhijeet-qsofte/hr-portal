#!/bin/bash
# HR Portal Local Testing Pipeline
# This script sets up and runs the HR Portal application locally

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Asikh Farms HR Portal Testing Pipeline =====${NC}"

# Check if PostgreSQL is running
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v pg_isready &> /dev/null; then
    echo -e "${RED}PostgreSQL client tools not found. Please install PostgreSQL.${NC}"
    exit 1
fi

if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL service.${NC}"
    exit 1
fi

echo -e "${GREEN}PostgreSQL is running.${NC}"

# Check if database exists, create if not
echo -e "\n${YELLOW}Checking database...${NC}"
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)

if ! psql -h localhost -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "Database $DB_NAME does not exist. Creating..."
    createdb -h localhost -U $DB_USER $DB_NAME
    echo -e "${GREEN}Database created.${NC}"
else
    echo -e "${GREEN}Database $DB_NAME exists.${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
cd backend && pip install -r requirements.txt
cd ..
echo -e "${GREEN}Dependencies installed.${NC}"

# Initialize database
echo -e "\n${YELLOW}Initializing database...${NC}"
cd backend && python setup.py --reset
cd ..
echo -e "${GREEN}Database initialized.${NC}"

# Run tests in background
echo -e "\n${YELLOW}Starting API server...${NC}"
cd backend && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
SERVER_PID=$!
cd ..

# Wait for server to start
echo -e "Waiting for server to start..."
sleep 5

# Run tests
echo -e "\n${YELLOW}Running API tests...${NC}"
cd backend && python tests.py
cd ..

# Ask if user wants to keep the server running
echo -e "\n${YELLOW}Tests completed. Do you want to keep the server running? (y/n)${NC}"
read -r keep_running

if [[ $keep_running != "y" ]]; then
    echo -e "\n${YELLOW}Shutting down server...${NC}"
    kill $SERVER_PID
    echo -e "${GREEN}Server stopped.${NC}"
else
    echo -e "\n${GREEN}Server is running at http://localhost:8000${NC}"
    echo -e "API documentation available at http://localhost:8000/docs"
    echo -e "To stop the server, press Ctrl+C or run: kill $SERVER_PID"
fi

echo -e "\n${GREEN}Pipeline completed successfully!${NC}"
