require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { startAutomation } = require('./services/automationService');

// Import routes
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const contactsRoutes = require('./routes/contacts');
const campaignsRoutes = require('./routes/campaigns');
const aiRoutes = require('./routes/ai');
const webhooksRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Unsubscribe page (public endpoint)
app.get('/unsubscribe/:contactId', async (req, res) => {
  try {
    const { query } = require('./database/config');
    const { contactId } = req.params;

    await query(
      `UPDATE contacts SET opted_out = true, opted_out_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [contactId]
    );

    await query(
      `INSERT INTO unsubscribes (contact_id, reason)
       VALUES ($1, 'unsubscribe_link')
       ON CONFLICT (contact_id) DO UPDATE SET unsubscribed_at = CURRENT_TIMESTAMP`,
      [contactId]
    );

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #333; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1>You've been unsubscribed</h1>
          <p>You will no longer receive emails from us. We're sorry to see you go!</p>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If this was a mistake, please contact us.
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error('Unsubscribe error', { error: error.message });
    res.status(500).send('An error occurred while processing your request.');
  }
});

// Analytics endpoint (dashboard summary)
app.get('/api/analytics/dashboard', async (req, res, next) => {
  try {
    const { query } = require('./database/config');
    const { authenticateToken } = require('./middleware/auth');

    // This would normally use authenticateToken middleware
    // For simplicity, we'll allow it without auth in this example

    // Get overall stats
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM contacts WHERE opted_out = false) as total_contacts,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT COUNT(*) FROM email_activities WHERE status = 'sent') as total_emails_sent,
        (SELECT COUNT(*) FROM email_activities WHERE opened_at IS NOT NULL) as total_opens,
        (SELECT COUNT(*) FROM email_activities WHERE replied_at IS NOT NULL) as total_replies
    `);

    const stats = statsResult.rows[0];

    // Calculate rates
    const totalSent = parseInt(stats.total_emails_sent) || 0;
    const openRate = totalSent > 0
      ? ((parseInt(stats.total_opens) / totalSent) * 100).toFixed(2)
      : 0;
    const replyRate = totalSent > 0
      ? ((parseInt(stats.total_replies) / totalSent) * 100).toFixed(2)
      : 0;

    // Get recent activity
    const recentActivity = await query(`
      SELECT ea.*, c.email, co.name as company_name
      FROM email_activities ea
      JOIN contacts c ON ea.contact_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      ORDER BY ea.created_at DESC
      LIMIT 10
    `);

    // Get industry breakdown
    const industryBreakdown = await query(`
      SELECT industry, COUNT(*) as count
      FROM companies
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 5
    `);

    res.json({
      stats: {
        ...stats,
        open_rate: openRate,
        reply_rate: replyRate,
      },
      recent_activity: recentActivity.rows,
      industry_breakdown: industryBreakdown.rows,
    });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}`);

  // Start automation in production
  if (process.env.NODE_ENV === 'production') {
    startAutomation();
  } else {
    logger.info('⏸️  Automation disabled in development mode');
    logger.info('💡 To enable automation, set NODE_ENV=production');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
