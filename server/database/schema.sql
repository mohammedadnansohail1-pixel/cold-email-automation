-- Cold Email Automation System Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  industry VARCHAR(100),
  size VARCHAR(50),
  employee_count INTEGER,
  revenue_range VARCHAR(50),
  website VARCHAR(255),
  headquarters_location VARCHAR(255),
  tech_stack JSONB DEFAULT '[]',
  ai_maturity_score INTEGER DEFAULT 0,
  description TEXT,
  linkedin_url VARCHAR(255),
  founded_year INTEGER,
  enrichment_data JSONB DEFAULT '{}',
  last_enriched TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on domain for fast lookups
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  title VARCHAR(200),
  department VARCHAR(100),
  seniority_level VARCHAR(50),
  linkedin_url VARCHAR(255),
  phone VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  email_valid BOOLEAN DEFAULT true,
  score INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  opted_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMP,
  bounce_status VARCHAR(50),
  last_contacted TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_opted_out ON contacts(opted_out);
CREATE INDEX IF NOT EXISTS idx_contacts_score ON contacts(score DESC);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  campaign_type VARCHAR(50) DEFAULT 'email',
  target_industry VARCHAR(100),
  target_company_size VARCHAR(50),
  target_titles JSONB DEFAULT '[]',
  sequence_data JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  daily_limit INTEGER DEFAULT 50,
  timezone VARCHAR(50) DEFAULT 'UTC',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  industry VARCHAR(100),
  subject_line TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  variables JSONB DEFAULT '[]',
  performance_stats JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Contacts (Join Table)
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  current_step INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_action_at TIMESTAMP,
  UNIQUE(campaign_id, contact_id)
);

-- Create indexes for campaign_contacts
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_contact ON campaign_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);

-- Email Activities Table
CREATE TABLE IF NOT EXISTS email_activities (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
  sequence_step INTEGER DEFAULT 0,
  subject_line TEXT,
  body_text TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  bounced_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  reply_text TEXT,
  bounce_reason TEXT,
  message_id VARCHAR(255),
  tracking_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for email_activities
CREATE INDEX IF NOT EXISTS idx_email_activities_contact ON email_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_campaign ON email_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_status ON email_activities(status);
CREATE INDEX IF NOT EXISTS idx_email_activities_sent_at ON email_activities(sent_at);

-- Email Events Table (for tracking opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  email_activity_id INTEGER REFERENCES email_activities(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email_events
CREATE INDEX IF NOT EXISTS idx_email_events_activity ON email_events(email_activity_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- Unsubscribes Table
CREATE TABLE IF NOT EXISTS unsubscribes (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  reason TEXT,
  feedback TEXT,
  unsubscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  UNIQUE(contact_id)
);

-- Jobs Queue Table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_for ON jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);

-- API Keys Table (for external integrations)
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  source VARCHAR(100),
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON webhooks(processed);

-- Analytics Table (for aggregated metrics)
CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, date)
);

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_campaign ON analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date DESC);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  split_percentage INTEGER DEFAULT 50,
  winner VARCHAR(10),
  results JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Lead Scoring Rules Table
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  condition_field VARCHAR(100) NOT NULL,
  condition_operator VARCHAR(50) NOT NULL,
  condition_value TEXT NOT NULL,
  score_adjustment INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log Table (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
