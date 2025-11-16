# API Documentation

Complete API reference for the AI Cold Email Automation System.

Base URL: `http://localhost:3001/api`

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Authentication

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
**GET** `/auth/me`

Get currently authenticated user information.

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

## Companies

### List Companies
**GET** `/companies`

Get a paginated list of companies with optional filters.

**Query Parameters:**
- `industry` (optional): Filter by industry
- `size` (optional): Filter by company size
- `min_score` (optional): Minimum AI maturity score
- `search` (optional): Search by name or domain
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:** `200 OK`
```json
{
  "companies": [
    {
      "id": 1,
      "name": "TechCorp Industries",
      "domain": "techcorp.example.com",
      "industry": "Finance",
      "size": "500-999",
      "employee_count": 750,
      "revenue_range": "$50M-$100M",
      "website": "https://techcorp.example.com",
      "ai_maturity_score": 65,
      "contact_count": 3
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

### Get Company
**GET** `/companies/:id`

Get detailed information about a specific company.

**Response:** `200 OK`
```json
{
  "company": {
    "id": 1,
    "name": "TechCorp Industries",
    "domain": "techcorp.example.com",
    "industry": "Finance",
    "contacts": [
      {
        "id": 1,
        "email": "john@techcorp.example.com",
        "first_name": "John",
        "last_name": "Smith",
        "title": "CTO"
      }
    ]
  }
}
```

### Create Company
**POST** `/companies`

Create a new company.

**Request Body:**
```json
{
  "name": "New Company Inc",
  "domain": "newcompany.com",
  "industry": "Technology",
  "size": "100-499",
  "employee_count": 250,
  "website": "https://newcompany.com",
  "description": "A technology company..."
}
```

**Response:** `201 Created`

### Update Company
**PUT** `/companies/:id`

Update company information.

**Response:** `200 OK`

### Delete Company
**DELETE** `/companies/:id`

Delete a company and all associated contacts.

**Response:** `200 OK`

### Get Company Statistics
**GET** `/companies/stats`

Get aggregate statistics about companies.

**Response:** `200 OK`
```json
{
  "stats": {
    "total_companies": 100,
    "unique_industries": 8,
    "avg_ai_maturity": 55.5,
    "large_companies": 25,
    "medium_companies": 50,
    "small_companies": 25
  },
  "industry_breakdown": [
    {"industry": "Finance", "count": 30},
    {"industry": "Healthcare", "count": 25}
  ]
}
```

## Contacts

### List Contacts
**GET** `/contacts`

Get a paginated list of contacts with optional filters.

**Query Parameters:**
- `company_id` (optional): Filter by company
- `seniority_level` (optional): Filter by seniority
- `department` (optional): Filter by department
- `min_score` (optional): Minimum lead score
- `opted_out` (optional): Filter opted out contacts
- `search` (optional): Search by name or email
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:** `200 OK`

### Get Contact
**GET** `/contacts/:id`

Get detailed contact information including email history.

**Response:** `200 OK`

### Create Contact
**POST** `/contacts`

Create a new contact.

**Request Body:**
```json
{
  "company_id": 1,
  "email": "jane@company.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "title": "VP of Engineering",
  "department": "Engineering",
  "seniority_level": "VP"
}
```

**Response:** `201 Created`

### Bulk Import Contacts
**POST** `/contacts/bulk`

Import multiple contacts at once.

**Request Body:**
```json
{
  "contacts": [
    {
      "company_id": 1,
      "email": "contact1@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "title": "CTO"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Bulk import completed",
  "results": {
    "created": 5,
    "failed": 0,
    "errors": []
  }
}
```

### Opt-out Contact
**POST** `/contacts/:id/opt-out`

Mark a contact as opted out from all communications.

**Request Body:**
```json
{
  "reason": "user_request",
  "feedback": "No longer interested"
}
```

**Response:** `200 OK`

## Campaigns

### List Campaigns
**GET** `/campaigns`

Get user's campaigns.

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, paused, completed)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

### Get Campaign
**GET** `/campaigns/:id`

Get campaign details including contacts and activities.

**Response:** `200 OK`

### Create Campaign
**POST** `/campaigns`

Create a new email campaign.

**Request Body:**
```json
{
  "name": "Q1 Finance Outreach",
  "description": "Target finance companies with AI consulting",
  "campaign_type": "email",
  "target_industry": "Finance",
  "target_company_size": "500-999",
  "daily_limit": 50,
  "sequence_data": [
    {
      "step": 1,
      "template_id": 1,
      "delay_days": 0
    },
    {
      "step": 2,
      "template_id": 2,
      "delay_days": 3
    }
  ]
}
```

**Response:** `201 Created`

### Add Contacts to Campaign
**POST** `/campaigns/:id/contacts`

Add contacts to a campaign.

**Request Body:**
```json
{
  "contact_ids": [1, 2, 3, 4, 5]
}
```

**Response:** `200 OK`

### Start Campaign
**POST** `/campaigns/:id/start`

Activate a campaign to begin sending emails.

**Response:** `200 OK`

### Pause Campaign
**POST** `/campaigns/:id/pause`

Pause an active campaign.

**Response:** `200 OK`

### Get Campaign Analytics
**GET** `/campaigns/:id/analytics`

Get detailed analytics for a campaign.

**Response:** `200 OK`
```json
{
  "analytics": {
    "total_emails": 100,
    "sent": 100,
    "delivered": 98,
    "opened": 45,
    "clicked": 12,
    "replied": 5,
    "bounced": 2,
    "unsubscribed": 1,
    "open_rate": "45.92",
    "click_rate": "12.24",
    "reply_rate": "5.10",
    "bounce_rate": "2.04",
    "daily_stats": [...]
  }
}
```

## AI Services

### Generate Personalized Email
**POST** `/ai/generate-email`

Generate a personalized email using AI.

**Request Body:**
```json
{
  "contact_id": 1,
  "template_type": "initial_outreach",
  "additional_context": "Recently raised Series A funding"
}
```

**Response:** `200 OK`
```json
{
  "email": {
    "subject": "Transform TechCorp's operations with AI",
    "body": "Hi John,\n\nI noticed TechCorp is leading..."
  }
}
```

### Generate Subject Line Variations
**POST** `/ai/generate-subject-variations`

Generate A/B test subject line variations.

**Request Body:**
```json
{
  "original_subject": "AI Solutions for Your Business",
  "company_name": "TechCorp",
  "industry": "Finance"
}
```

**Response:** `200 OK`
```json
{
  "variations": [
    "Quick question about TechCorp's AI strategy",
    "Reduce costs 40% with AI at TechCorp",
    "John - AI opportunity for Finance leaders"
  ]
}
```

### Analyze Company
**POST** `/ai/analyze-company`

Analyze a company's AI readiness.

**Request Body:**
```json
{
  "company_id": 1
}
```

**Response:** `200 OK`
```json
{
  "analysis": {
    "ai_maturity_score": 65,
    "opportunities": [
      "Automated fraud detection",
      "Predictive analytics",
      "Process automation"
    ],
    "pain_points": [
      "Manual data processing",
      "Legacy systems",
      "Scaling challenges"
    ],
    "approach": "Focus on quick wins with process automation..."
  }
}
```

### Classify Reply
**POST** `/ai/classify-reply`

Classify sentiment and intent of an email reply.

**Request Body:**
```json
{
  "reply_text": "Thanks for reaching out! I'd love to learn more. Can we schedule a call next week?"
}
```

**Response:** `200 OK`
```json
{
  "classification": {
    "sentiment": "positive",
    "intent": "meeting_request",
    "requires_action": true,
    "suggested_response": "Schedule a meeting and send calendar invite"
  }
}
```

## Analytics

### Get Dashboard Analytics
**GET** `/analytics/dashboard`

Get overall system analytics and metrics.

**Response:** `200 OK`
```json
{
  "stats": {
    "total_companies": 500,
    "total_contacts": 1500,
    "active_campaigns": 5,
    "total_emails_sent": 10000,
    "total_opens": 4500,
    "total_replies": 500,
    "open_rate": "45.00",
    "reply_rate": "5.00"
  },
  "recent_activity": [...],
  "industry_breakdown": [...]
}
```

## Webhooks

### SendGrid Webhook
**POST** `/webhooks/sendgrid`

Receive email events from SendGrid.

This endpoint is called automatically by SendGrid when email events occur (opens, clicks, bounces, etc.).

**Request Body:** SendGrid event array

**Response:** `200 OK`

### Email Open Tracking
**GET** `/webhooks/track/open/:activityId`

Tracking pixel endpoint for email opens.

This endpoint is embedded in emails as a 1x1 pixel image.

**Response:** `200 OK` (1x1 transparent GIF)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Duplicate entry",
  "message": "A record with this value already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authenticated endpoints may have different limits
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Best Practices

1. **Always include error handling** in your API calls
2. **Store JWT tokens securely** (never in localStorage for production)
3. **Respect rate limits** to avoid being blocked
4. **Use pagination** for large result sets
5. **Include proper Content-Type headers**
6. **Validate data** before sending to API
7. **Handle authentication errors** gracefully

## Example Usage

### Using cURL
```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

# Get companies
curl http://localhost:3001/api/companies \
  -H "Authorization: Bearer $TOKEN"
```

### Using JavaScript (fetch)
```javascript
// Login
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
});

const { token } = await response.json();

// Get companies
const companiesResponse = await fetch('http://localhost:3001/api/companies', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { companies } = await companiesResponse.json();
```

## Support

For API support or to report issues:
1. Check this documentation
2. Review error messages
3. Check server logs
4. Open an issue in the repository
