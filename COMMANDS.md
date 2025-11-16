# Command Reference Guide

Complete list of all available commands and scripts for the AI Cold Email Automation System.

---

## 🚀 NPM Scripts

### Development

```bash
# Start both backend and frontend in development mode
npm run dev

# Start only the backend server
npm run server:dev

# Start only the frontend
npm run client:dev
```

### Database Management

```bash
# Run database migrations (create tables)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (clear + reseed)
npm run db:reset

# Show database statistics
npm run db:stats
```

### Setup & Testing

```bash
# Automated setup (runs setup.sh)
npm run setup

# Test all API endpoints
npm run test:api

# Access dev tools menu
npm run tools
```

### Production

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

---

## 🛠️ Development Tools

The `dev-tools.js` script provides helpful utilities:

### Database Statistics

```bash
# Show record counts for all tables
npm run db:stats

# Or directly:
node scripts/dev-tools.js stats
```

**Output:**
```
📊 Database Statistics

  users                      1 records
  companies                  5 records
  contacts                  15 records
  campaigns                  1 records
  email_templates           10 records
  email_activities           0 records
```

### Clear Database

```bash
# Clear all data from database (keep tables)
node scripts/dev-tools.js clear
```

**Warning:** This will delete all data but preserve the schema.

### Reset Database

```bash
# Clear all data and reseed with sample data
npm run db:reset

# Or directly:
node scripts/dev-tools.js reset
```

### Generate Test Contacts

```bash
# Generate 10 test contacts
node scripts/dev-tools.js generate 10

# Generate 50 test contacts
node scripts/dev-tools.js generate 50

# Generate 100 test contacts
node scripts/dev-tools.js generate 100
```

**Output:**
```
🔧 Generating 10 test contacts...

  ✓ Created john.smith0@techcorp.com
  ✓ Created jane.johnson1@innovate.io
  ✓ Created michael.williams2@datatech.com
  ...

✅ Created 10 test contacts
```

### Campaign Performance Report

```bash
# Show performance metrics for all campaigns
node scripts/dev-tools.js performance
```

**Output:**
```
📈 Campaign Performance

  Campaign: Finance Sector AI Outreach Q1
    Status: draft
    Contacts: 5
    Sent: 0
    Opened: 0 (0.0%)
    Clicked: 0
    Replied: 0 (0.0%)
```

### Create Admin User

```bash
# Create admin with default credentials
node scripts/dev-tools.js admin

# Create admin with custom credentials
node scripts/dev-tools.js admin admin@mycompany.com mypassword123
```

### Help

```bash
# Show dev tools help
node scripts/dev-tools.js help
```

---

## 🐳 Docker Commands

### Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
```

### Database Setup (Docker)

```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Seed sample data
docker-compose exec app npm run db:seed

# Reset database
docker-compose exec app npm run db:reset
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Access Services

```bash
# Access app container shell
docker-compose exec app sh

# Access PostgreSQL
docker-compose exec postgres psql -U postgres coldoutreach

# Access Redis CLI
docker-compose exec redis redis-cli
```

---

## 🧪 Testing Commands

### API Testing Script

```bash
# Test all API endpoints
npm run test:api

# Or directly:
bash scripts/test-api.sh
```

**Tests:**
- Health endpoint
- Authentication (login)
- Companies API
- Contacts API
- Campaigns API
- Analytics API
- AI endpoints (if OpenAI key configured)
- Create operations

### Manual API Testing

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get companies (with token)
curl http://localhost:3001/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Commands

### Direct PostgreSQL Access

```bash
# Connect to database
psql coldoutreach

# Or with full connection string
psql postgresql://postgres:postgres@localhost:5432/coldoutreach
```

### Common SQL Queries

```sql
-- Count records in each table
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts;

-- View recent campaigns
SELECT id, name, status, created_at FROM campaigns ORDER BY created_at DESC;

-- View contacts with companies
SELECT c.email, c.first_name, c.last_name, co.name as company
FROM contacts c
JOIN companies co ON c.company_id = co.id;

-- Campaign performance
SELECT
  c.name,
  COUNT(DISTINCT cc.id) as contacts,
  COUNT(DISTINCT ea.id) as emails_sent
FROM campaigns c
LEFT JOIN campaign_contacts cc ON c.id = cc.campaign_id
LEFT JOIN email_activities ea ON c.id = ea.campaign_id
GROUP BY c.id, c.name;
```

### Database Backup

```bash
# Backup database
pg_dump coldoutreach > backup.sql

# Restore database
psql coldoutreach < backup.sql

# Backup with Docker
docker-compose exec postgres pg_dump -U postgres coldoutreach > backup.sql
```

---

## 🔧 Maintenance Commands

### View Logs

```bash
# View all logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# Clear logs
rm logs/*.log
```

### Check System Health

```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running
redis-cli ping

# Check Node.js version
node -v

# Check npm version
npm -v
```

### Update Dependencies

```bash
# Update backend dependencies
npm update

# Update frontend dependencies
cd client && npm update && cd ..

# Check for outdated packages
npm outdated
cd client && npm outdated && cd ..
```

---

## 🌐 Frontend Commands

### Development

```bash
# Start frontend dev server
cd client && npm run dev

# Build for production
cd client && npm run build

# Start production build
cd client && npm start
```

### Linting

```bash
cd client

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint -- --fix
```

---

## 📦 Installation Commands

### Initial Setup

```bash
# Automated setup (recommended)
npm run setup

# Or manual setup:
npm install
cd client && npm install && cd ..
createdb coldoutreach
npm run db:migrate
npm run db:seed
```

### Clean Install

```bash
# Remove all dependencies
rm -rf node_modules client/node_modules

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
cd client && npm install && cd ..
```

---

## 🔐 Security Commands

### Generate Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Check for Vulnerabilities

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check both frontend and backend
npm audit && cd client && npm audit && cd ..
```

---

## 📈 Monitoring Commands

### Check Running Processes

```bash
# Check if server is running
lsof -i :3001

# Check if frontend is running
lsof -i :3000

# Kill process on port
kill -9 $(lsof -t -i:3001)
```

### Monitor Resources

```bash
# Monitor Node.js process
top -p $(pgrep -f "node server/index.js")

# Monitor Docker containers
docker stats

# Check disk usage
df -h
```

---

## 🎯 Quick Commands Cheat Sheet

| Task | Command |
|------|---------|
| **Start development** | `npm run dev` |
| **Setup from scratch** | `npm run setup` |
| **Reset database** | `npm run db:reset` |
| **Test API** | `npm run test:api` |
| **View stats** | `npm run db:stats` |
| **Generate contacts** | `node scripts/dev-tools.js generate 50` |
| **Create admin** | `node scripts/dev-tools.js admin email password` |
| **Docker start** | `docker-compose up -d` |
| **Docker logs** | `docker-compose logs -f` |
| **Access PostgreSQL** | `psql coldoutreach` |
| **Health check** | `curl localhost:3001/health` |

---

## 🆘 Troubleshooting Commands

### Database Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS)
brew services restart postgresql@15

# Restart PostgreSQL (Linux)
sudo systemctl restart postgresql

# Drop and recreate database
dropdb coldoutreach && createdb coldoutreach
npm run db:migrate && npm run db:seed
```

### Port Issues

```bash
# Find what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or kill all Node processes
killall node
```

### Clear Everything

```bash
# Stop all Docker containers
docker-compose down -v

# Clear Node modules
rm -rf node_modules client/node_modules

# Clear logs
rm -rf logs/*.log

# Clear database
dropdb coldoutreach

# Fresh start
npm run setup
```

---

## 📚 Additional Resources

### Documentation Files

- `README.md` - System overview
- `SETUP_GUIDE.md` - Detailed setup
- `QUICK_START.md` - 5-minute guide
- `API_DOCUMENTATION.md` - API reference
- `FEATURES.md` - Feature list
- `PROJECT_SUMMARY.md` - Statistics
- `CHANGELOG.md` - Version history
- `COMMANDS.md` - This file

### Scripts Location

- `scripts/setup.sh` - Automated setup
- `scripts/dev-tools.js` - Development utilities
- `scripts/test-api.sh` - API testing
- `server/database/migrate.js` - Migrations
- `server/database/seed.js` - Sample data

### Configuration Files

- `.env` - Environment variables
- `.env.example` - Environment template
- `docker-compose.yml` - Docker setup
- `Dockerfile` - Container build
- `package.json` - Dependencies
- `client/package.json` - Frontend deps

---

**Tip:** Save this file as a reference for quick command lookups!

For more detailed information, see the other documentation files.
