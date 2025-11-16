# Quick Start Guide

Get your AI Cold Email Automation System up and running in **5 minutes**!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Git installed

## Installation Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cold-email-automation

# Install dependencies
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
# At minimum, you need:
# - Database credentials (default works for local PostgreSQL)
# - JWT_SECRET (change from default)
# - OPENAI_API_KEY (for AI features)
# - SENDGRID_API_KEY (for email sending)
```

### 3. Set Up Database

```bash
# Create database
createdb coldoutreach

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 4. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### 5. Login

Navigate to http://localhost:3000 and login with:
- **Email**: admin@example.com
- **Password**: admin123

## What's Included Out of the Box

After seeding, you'll have:

✅ **1 Admin User** - Ready to use
✅ **5 Sample Companies** - Finance, Healthcare, Retail, Manufacturing, Technology
✅ **15 Contacts** - 3 decision makers per company
✅ **10 Email Templates** - Industry-specific templates ready to use
✅ **1 Sample Campaign** - Pre-configured for Finance sector
✅ **Lead Scoring Rules** - Automatic contact scoring

## First Steps After Login

### 1. Explore the Dashboard
- View overall metrics and statistics
- Check recent email activity
- Review industry breakdown

### 2. Review Companies
1. Click "Companies" in the navigation
2. Browse the 5 sample companies
3. Click "Add Company" to create a new one
4. View company details including AI maturity scores

### 3. Check Contacts
1. Click "Contacts" in the navigation
2. See all 15 sample contacts with their details
3. Filter by seniority level or search by name
4. Add new contacts or import in bulk

### 4. Create Your First Campaign
1. Click "Campaigns" in the navigation
2. Click "New Campaign"
3. Fill in the campaign details:
   - Name: "My First Campaign"
   - Target Industry: Select one
   - Daily Limit: Start with 50
4. Click "Create Campaign"

### 5. Add Contacts to Campaign
1. Open your campaign
2. Select target contacts
3. Configure email sequence
4. Start the campaign

## Testing AI Features

### Generate Personalized Email

```bash
curl -X POST http://localhost:3001/api/ai/generate-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": 1,
    "template_type": "initial_outreach"
  }'
```

### Analyze Company AI Readiness

```bash
curl -X POST http://localhost:3001/api/ai/analyze-company \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1
  }'
```

## Common Tasks

### Import Contacts

Use the API to bulk import:

```bash
curl -X POST http://localhost:3001/api/contacts/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "company_id": 1,
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "title": "VP of Technology"
      }
    ]
  }'
```

### Start a Campaign

```bash
curl -X POST http://localhost:3001/api/campaigns/1/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Analytics

```bash
curl http://localhost:3001/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Configuration Tips

### Email Sending
- In development, emails are logged but not sent
- Set `NODE_ENV=production` and add SendGrid API key for real sending
- Verify your sender email in SendGrid

### AI Features
- Add your OpenAI API key to `.env`
- GPT-4 is used for email generation (requires credits)
- Test with sample contacts first

### Daily Limits
- Start with 50 emails/day
- Gradually increase as your domain warms up
- Monitor bounce rates in analytics

## Troubleshooting

### Can't Connect to Database
```bash
# Check if PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep coldoutreach
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

### API Returns 401
- Your token may have expired
- Login again to get a new token
- Check `JWT_SECRET` is set in `.env`

## Next Steps

1. **Add Your Companies**
   - Import your target list
   - Enrich with Apollo.io or Clearbit (optional)

2. **Create Templates**
   - Customize the sample templates
   - Create industry-specific variations
   - Test with AI generation

3. **Build Campaigns**
   - Create multi-step sequences
   - Set up A/B tests
   - Monitor performance

4. **Scale Up**
   - Increase daily limits gradually
   - Add more contacts
   - Optimize based on analytics

## Resources

- **Full Documentation**: See README.md
- **Setup Guide**: See SETUP_GUIDE.md
- **API Reference**: See API_DOCUMENTATION.md
- **Health Check**: http://localhost:3001/health

## Need Help?

1. Check the logs in `logs/` directory
2. Review error messages in the console
3. Consult the documentation files
4. Open an issue in the repository

## Production Deployment

When ready for production:

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Add real API keys
4. Enable HTTPS
5. Set up monitoring
6. Configure backups

See SETUP_GUIDE.md for detailed production deployment instructions.

---

**Congratulations!** 🎉 You're now ready to automate your cold email outreach with AI!

For advanced features and customization, refer to the complete documentation.
