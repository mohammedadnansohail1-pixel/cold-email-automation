const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// POST /api/webhooks/sendgrid
router.post('/sendgrid', async (req, res, next) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    await emailService.processEmailWebhook(events);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Webhook processing error', { error: error.message });
    next(error);
  }
});

// GET /api/webhooks/track/open/:activityId (tracking pixel)
router.get('/track/open/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { query } = require('../database/config');

    // Update email activity
    await query(
      `UPDATE email_activities
       SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
           open_count = open_count + 1
       WHERE id = $1`,
      [activityId]
    );

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    res.end(pixel);
  } catch (error) {
    logger.error('Open tracking error', { error: error.message });
    res.status(200).end(); // Still return success to avoid breaking email clients
  }
});

module.exports = router;
