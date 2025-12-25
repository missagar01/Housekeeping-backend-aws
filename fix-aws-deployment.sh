#!/bin/bash
# Quick fix script for AWS deployment
# Run this on AWS server if PM2 is running from wrong directory

DEPLOY_DIR="/home/ubuntu/Housekeeping-backend"
APP_NAME="housekeeping-backend"

echo "🔧 Fixing AWS deployment..."

# Stop and delete existing PM2 process
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    echo "Stopping existing PM2 process..."
    pm2 stop "${APP_NAME}" || true
    pm2 delete "${APP_NAME}" || true
fi

# Make sure deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ Deploy directory $DEPLOY_DIR not found!"
    echo "Please run the GitHub Actions workflow first."
    exit 1
fi

cd "$DEPLOY_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found in $DEPLOY_DIR"
    echo "Please create it manually or run the GitHub Actions workflow."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Start PM2 from correct directory
echo "Starting PM2 from $DEPLOY_DIR..."
pm2 start "$DEPLOY_DIR/src/server.js" --name "${APP_NAME}" --update-env

pm2 save

echo "✅ Done! PM2 status:"
pm2 status

echo ""
echo "📋 To view logs:"
echo "pm2 logs ${APP_NAME}"



