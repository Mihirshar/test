#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Safehood Backend Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    exit 1
fi

# Check if all required environment variables are set
required_vars=(
    "DB_HOST"
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "TWILIO_ACCOUNT_SID"
    "FIREBASE_PRIVATE_KEY"
)

for var in "${required_vars[@]}"; do
    if grep -q "^$var=CHANGE_THIS" .env.production; then
        echo "❌ Error: $var needs to be set in .env.production"
        exit 1
    fi
done

echo "✅ Environment validation passed"

# Build the application
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t safehood-backend:latest .

# Tag Docker image
echo "🏷️ Tagging Docker image..."
docker tag safehood-backend:latest safehood-backend:$(date +%Y%m%d_%H%M%S)

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p /var/log/safehood
chmod 755 /var/log/safehood

# Copy production environment file
echo "📝 Copying production environment file..."
cp .env.production .env

echo "✅ Deployment preparation complete!"
echo ""
echo "To run the container, execute:"
echo "docker run -d --name safehood-backend \\"
echo "  -p 3000:3000 \\"
echo "  --restart unless-stopped \\"
echo "  -v /var/log/safehood:/app/logs \\"
echo "  -v /path/to/uploads:/app/uploads \\"
echo "  --env-file .env.production \\"
echo "  safehood-backend:latest" 