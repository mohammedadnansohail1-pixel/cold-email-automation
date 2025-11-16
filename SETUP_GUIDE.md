# Complete Setup Guide

This guide will walk you through setting up the AI Cold Email Automation System from scratch.

## Prerequisites Installation

### 1. Install Node.js
```bash
# Download and install Node.js 18+ from nodejs.org
# Verify installation
node --version  # Should be 18.x or higher
npm --version
```

### 2. Install PostgreSQL
```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15

# Windows
# Download installer from postgresql.org
```

### 3. Install Redis (Optional but Recommended)
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Windows
# Download from redis.io
```

## Project Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cold-email-automation

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Database Setup

```bash
# Start PostgreSQL (if not already running)
# macOS
brew services start postgresql@15

# Create database
createdb coldoutreach

# Or using psql
psql postgres
CREATE DATABASE coldoutreach;
\q
```

### Step 3: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://localhost:5432/coldoutreach
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coldoutreach
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (Change this!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# SendGrid Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=AI Consulting Outreach

# Apollo.io Configuration (Optional)
APOLLO_API_KEY=your-apollo-api-key-here

# Clearbit Configuration (Optional)
CLEARBIT_API_KEY=your-clearbit-api-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 4: Get API Keys

#### OpenAI API Key (Required for AI features)
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env`

#### SendGrid API Key (Required for email sending)
1. Go to https://sendgrid.com/
2. Sign up for a free account
3. Navigate to Settings > API Keys
4. Create a new API key with "Full Access"
5. Copy and paste into `.env`
6. Verify your sender email in SendGrid

#### Apollo.io API Key (Optional for lead enrichment)
1. Go to https://www.apollo.io/
2. Sign up for an account
3. Navigate to API settings
4. Copy your API key

#### Clearbit API Key (Optional for company enrichment)
1. Go to https://clearbit.com/
2. Sign up for an account
3. Get your API key from the dashboard

### Step 5: Run Database Migrations

```bash
# Run migrations to create tables
npm run db:migrate

# Seed sample data
npm run db:seed
```

You should see output like:
```
✓ Created default admin user (admin@example.com / admin123)
✓ Seeded sample companies and contacts
✓ Seeded 10 email templates
✓ Seeded sample campaign
✓ Seeded lead scoring rules
```

### Step 6: Start the Application

```bash
# Start both backend and frontend
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Step 7: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Step 8: Login

Use the demo credentials:
- **Email**: admin@example.com
- **Password**: admin123

## Docker Setup (Alternative)

If you prefer using Docker:

### Step 1: Install Docker
Download and install Docker Desktop from docker.com

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Step 3: Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npm run db:migrate

# Seed data
docker-compose exec app npm run db:seed
```

### Step 4: Access
- Application: http://localhost:3000
- API: http://localhost:3001

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U postgres -d coldoutreach

# If permission denied, update pg_hba.conf to allow local connections
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

### OpenAI API Errors

- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has the necessary permissions

### SendGrid Email Not Sending

- Verify your API key
- Check sender email is verified in SendGrid
- Review SendGrid logs for bounces/blocks
- In development, emails are logged but not actually sent

### Database Migration Fails

```bash
# Drop and recreate database
dropdb coldoutreach
createdb coldoutreach

# Run migrations again
npm run db:migrate
```

## Production Deployment

### Step 1: Build Frontend
```bash
cd client
npm run build
```

### Step 2: Set Production Environment
```env
NODE_ENV=production
DATABASE_URL=<production-database-url>
# Add production API keys
```

### Step 3: Run Migrations on Production Database
```bash
npm run db:migrate
```

### Step 4: Start Production Server
```bash
npm start
```

## Next Steps

1. **Customize Email Templates**: Edit templates in the database or create new ones via API
2. **Add Your Companies**: Import your target companies via the UI or API
3. **Create Contacts**: Add decision makers to your companies
4. **Build Campaigns**: Create email sequences and campaigns
5. **Monitor Analytics**: Track performance in real-time

## Security Best Practices

1. **Change JWT Secret**: Use a strong, random secret in production
2. **Use Environment Variables**: Never commit API keys to version control
3. **Enable HTTPS**: Use SSL certificates in production
4. **Regular Backups**: Backup your PostgreSQL database regularly
5. **Update Dependencies**: Keep packages up to date for security patches
6. **Rate Limiting**: Configure appropriate limits for your use case
7. **Monitor Logs**: Regularly check logs for suspicious activity

## Support

If you encounter any issues:
1. Check the logs in `logs/` directory
2. Review this setup guide
3. Check the main README.md
4. Open an issue in the repository

## Testing the System

### 1. Test Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 2. Test API (with token from above)
```bash
curl http://localhost:3001/api/companies \
  -H "Authorization: Bearer <your-token>"
```

### 3. Test Health Endpoint
```bash
curl http://localhost:3001/health
```

Congratulations! Your AI Cold Email Automation System is now set up and ready to use! 🎉
