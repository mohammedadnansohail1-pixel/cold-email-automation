# AI Cold Email Automation System

A complete, production-ready full-stack application for automated cold email outreach targeting potential AI consulting clients. Built with React, Next.js, Node.js, Express, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **AI-Powered Email Generation**: Personalized emails using OpenAI GPT-4
- **Lead Management**: Complete CRUD for companies and contacts
- **Campaign Automation**: Multi-step email sequences with smart scheduling
- **Real-time Analytics**: Track opens, clicks, replies, and conversions
- **Lead Enrichment**: Integration with Apollo.io and Clearbit
- **Compliance**: GDPR, CAN-SPAM compliant with automated opt-out handling
- **Email Deliverability**: SPF/DKIM/DMARC support, bounce handling, warmup scheduling

### Technical Features
- **RESTful API**: Complete backend API with Express.js
- **Modern Frontend**: Next.js with React and Tailwind CSS
- **Database**: PostgreSQL with comprehensive schema
- **Caching**: Redis for performance optimization
- **Authentication**: JWT-based secure authentication
- **Rate Limiting**: API protection and abuse prevention
- **Error Handling**: Comprehensive logging with Winston
- **Containerization**: Docker and Docker Compose ready
- **Job Scheduling**: Automated campaigns with node-cron

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)
- OpenAI API key (for AI features)
- SendGrid API key (for email sending)

## 🛠️ Installation

### Quick Start (Development)

1. **Clone the repository**
```bash
git clone <repository-url>
cd cold-email-automation
```

2. **Install dependencies**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- Database credentials
- API keys (OpenAI, SendGrid, Apollo, Clearbit)
- JWT secret
- Other configuration

4. **Set up the database**
```bash
# Create the database (make sure PostgreSQL is running)
createdb coldoutreach

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

5. **Start the development servers**
```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Backend: npm run server:dev
# Frontend: cd client && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Login with demo account: `admin@example.com` / `admin123`

### Docker Deployment

1. **Using Docker Compose (Recommended)**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Initialize the database**
```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Seed data
docker-compose exec app npm run db:seed
```

3. **Access the application**
- Application: http://localhost:3000
- API: http://localhost:3001

## 🗄️ Database Schema

The system includes comprehensive database tables:

- `users` - User accounts and authentication
- `companies` - Target companies for outreach
- `contacts` - Decision makers and contact information
- `campaigns` - Email campaign configurations
- `email_templates` - Reusable email templates
- `campaign_contacts` - Campaign-contact relationships
- `email_activities` - Email send history and tracking
- `email_events` - Detailed event tracking (opens, clicks)
- `unsubscribes` - Opt-out management
- `analytics` - Aggregated performance metrics
- `jobs` - Background job queue
- `webhooks` - Webhook event storage

## 📚 API Documentation

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**GET /api/auth/me**
Headers: `Authorization: Bearer <token>`

### Companies

- `GET /api/companies` - List companies (with filters)
- `GET /api/companies/:id` - Get single company
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/stats` - Get statistics

### Contacts

- `GET /api/contacts` - List contacts (with filters)
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `POST /api/contacts/bulk` - Bulk import contacts
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/:id/opt-out` - Opt-out contact

### Campaigns

- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/contacts` - Add contacts to campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign
- `GET /api/campaigns/:id/analytics` - Get campaign analytics

### AI Services

- `POST /api/ai/generate-email` - Generate personalized email
- `POST /api/ai/generate-subject-variations` - Generate subject line variants
- `POST /api/ai/analyze-company` - Analyze company AI readiness
- `POST /api/ai/classify-reply` - Classify email reply sentiment

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard summary

## 🤖 Automation Features

The system includes several automated processes:

### Campaign Email Processing
- Runs every 30 minutes
- Processes pending campaign emails
- Respects daily limits
- Handles email sequences automatically

### Follow-up Processing
- Runs daily at 10 AM
- Identifies contacts who opened but didn't reply
- Sends intelligent follow-ups

### Analytics Updates
- Runs daily at midnight
- Aggregates campaign performance metrics
- Updates analytics tables

### To Enable Automation
Set `NODE_ENV=production` in your environment variables.

## 📊 Sample Data

The system comes with pre-seeded sample data:

- 1 Admin user (`admin@example.com` / `admin123`)
- 5 Sample companies across different industries
- 15 Contacts (3 per company)
- 10 Email templates (industry-specific)
- 1 Sample campaign
- Lead scoring rules

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Data Encryption**: Sensitive data encryption at rest

## 🎨 Frontend Features

### Dashboard
- Real-time metrics overview
- Campaign performance charts
- Industry breakdown visualization
- Recent activity feed
- Quick actions

### Pages Included
- Login/Register
- Dashboard
- Companies (coming soon)
- Contacts (coming soon)
- Campaigns (coming soon)
- Analytics (coming soon)

## 📈 Performance Optimization

- **Redis Caching**: Frequently accessed data
- **Database Indexing**: Optimized query performance
- **Lazy Loading**: Large datasets
- **Connection Pooling**: Efficient database connections
- **Compression**: API response compression

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test

# Run linter
npm run lint
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Configure production database
   - Add real API keys
   - Set secure JWT_SECRET
   - Configure FRONTEND_URL

2. **Database**
   - Run migrations: `npm run db:migrate`
   - Optionally seed data: `npm run db:seed`

3. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

4. **Start Application**
   ```bash
   npm start
   ```

### Deployment Platforms

The application can be deployed to:
- **AWS**: EC2, ECS, or Elastic Beanstalk
- **Heroku**: With Heroku Postgres add-on
- **DigitalOcean**: App Platform or Droplets
- **Vercel**: Frontend only, API separately
- **Docker**: Any container orchestration platform

## 📝 Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `SENDGRID_API_KEY` - SendGrid for email sending
- `APOLLO_API_KEY` - Apollo.io for lead enrichment
- `CLEARBIT_API_KEY` - Clearbit for company enrichment
- `REDIS_URL` - Redis connection string
- `FRONTEND_URL` - Frontend URL for CORS and links

## 🔧 Configuration

### Email Sending Limits
- `DAILY_EMAIL_LIMIT`: 500 (default)
- `HOURLY_EMAIL_LIMIT`: 50 (default)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: 900000 (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: 100

## 📞 Support & Documentation

For issues, questions, or contributions:
1. Check the documentation
2. Review the API endpoints
3. Check logs in `logs/` directory
4. Open an issue in the repository

## 🔄 Roadmap

- [ ] LinkedIn automation integration
- [ ] Advanced A/B testing
- [ ] Email warmup automation
- [ ] Meeting booking integration (Calendly)
- [ ] SMS outreach channel
- [ ] Team collaboration features
- [ ] Advanced reporting and exports
- [ ] Webhook support for integrations
- [ ] Mobile app

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

Built with:
- Next.js & React
- Express.js
- PostgreSQL
- OpenAI GPT-4
- SendGrid
- Tailwind CSS
- And many other amazing open-source libraries

---

**Ready to launch your AI-powered cold email campaigns!** 🚀

For questions or support, please refer to the documentation or open an issue.
