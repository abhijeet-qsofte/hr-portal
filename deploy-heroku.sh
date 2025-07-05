#!/bin/bash
# Script to deploy the HR Portal to Heroku

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Asikh Farms HR Portal Heroku Deployment =====${NC}"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}Heroku CLI not found. Please install it first:${NC}"
    echo -e "brew tap heroku/brew && brew install heroku"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}You need to login to Heroku first:${NC}"
    heroku login
fi

# Ask for app name
echo -e "${YELLOW}Enter your Heroku app name (leave blank to create a new app):${NC}"
read -r app_name

if [ -z "$app_name" ]; then
    echo -e "${YELLOW}Creating a new Heroku app...${NC}"
    app_name=$(heroku create --json | jq -r '.name')
    echo -e "${GREEN}Created app: $app_name${NC}"
else
    # Check if app exists
    if ! heroku apps:info --app "$app_name" &> /dev/null; then
        echo -e "${YELLOW}App $app_name doesn't exist. Creating it...${NC}"
        heroku create "$app_name"
    else
        echo -e "${GREEN}Using existing app: $app_name${NC}"
    fi
fi

# Set stack to container
echo -e "${YELLOW}Setting stack to container...${NC}"
heroku stack:set container --app "$app_name"

# Add PostgreSQL addon
echo -e "${YELLOW}Adding PostgreSQL addon...${NC}"
if ! heroku addons:info --app "$app_name" postgresql &> /dev/null; then
    heroku addons:create heroku-postgresql:mini --app "$app_name"
    echo -e "${GREEN}PostgreSQL addon added.${NC}"
else
    echo -e "${GREEN}PostgreSQL addon already exists.${NC}"
fi

# Push to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push https://git.heroku.com/"$app_name".git HEAD:main

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
heroku run --app "$app_name" "cd backend && alembic upgrade head"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your app is available at: https://$app_name.herokuapp.com${NC}"
echo -e "${GREEN}API documentation: https://$app_name.herokuapp.com/docs${NC}"
