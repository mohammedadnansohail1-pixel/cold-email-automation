#!/bin/bash

# AI Cold Email Automation System - Automated Setup Script
# This script automates the entire setup process

set -e  # Exit on any error

echo "🚀 AI Cold Email Automation System - Automated Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL 15+ and run this script again"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL installed${NC}"

# Check if database is running
if ! pg_isready &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL and run this script again"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Setup environment file
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and add your API keys${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping${NC}"
fi
echo ""

# Create database
echo "🗄️  Setting up database..."
DB_NAME="coldoutreach"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dropdb $DB_NAME
        createdb $DB_NAME
        echo -e "${GREEN}✓ Database recreated${NC}"
    else
        echo -e "${YELLOW}⚠ Using existing database${NC}"
    fi
else
    createdb $DB_NAME
    echo -e "${GREEN}✓ Database created${NC}"
fi
echo ""

# Run migrations
echo "🔧 Running database migrations..."
npm run db:migrate
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed
echo -e "${GREEN}✓ Database seeded${NC}"
echo ""

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "=================================================="
echo ""
echo "📊 What's been set up:"
echo "  • Backend dependencies installed"
echo "  • Frontend dependencies installed"
echo "  • Database created and migrated"
echo "  • Sample data seeded"
echo "  • Environment file created"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit .env and add your API keys:"
echo "     - OPENAI_API_KEY (for AI features)"
echo "     - SENDGRID_API_KEY (for email sending)"
echo "     - Other API keys (optional)"
echo ""
echo "  2. Start the application:"
echo "     npm run dev"
echo ""
echo "  3. Access the application:"
echo "     Frontend: http://localhost:3000"
echo "     Backend:  http://localhost:3001"
echo ""
echo "  4. Login with demo account:"
echo "     Email:    admin@example.com"
echo "     Password: admin123"
echo ""
echo "📚 Documentation:"
echo "  • README.md - Complete overview"
echo "  • QUICK_START.md - 5-minute guide"
echo "  • SETUP_GUIDE.md - Detailed setup"
echo "  • API_DOCUMENTATION.md - API reference"
echo ""
echo -e "${GREEN}Happy cold emailing! 🚀${NC}"
echo ""
