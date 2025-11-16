const sgMail = require('@sendgrid/mail');
const { query } = require('../database/config');
const logger = require('../utils/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'dummy_key_for_dev');

// Send single email
const sendEmail = async ({
  to,
  subject,
  text,
  html,
  contactId,
  campaignId,
  templateId,
  sequenceStep = 0,
}) => {
  try {
    // Check if contact has opted out
    const contactCheck = await query(
      'SELECT opted_out FROM contacts WHERE id = $1',
      [contactId]
    );

    if (contactCheck.rows.length > 0 && contactCheck.rows[0].opted_out) {
      logger.warn('Attempted to send email to opted-out contact', { contactId });
      throw new Error('Contact has opted out');
    }

    // Create email activity record
    const activityResult = await query(
      `INSERT INTO email_activities (contact_id, campaign_id, template_id, sequence_step,
                                     subject_line, body_text, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING id`,
      [contactId, campaignId, templateId, sequenceStep, subject, text]
    );

    const activityId = activityResult.rows[0].id;

    // Add tracking parameters
    const trackingId = activityId;
    const trackingPixelUrl = `${process.env.FRONTEND_URL}/api/track/open/${trackingId}`;
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${contactId}`;

    // Add tracking pixel to HTML
    const htmlWithTracking = html
      ? `${html}<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`
      : null;

    // Prepare email message
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'AI Consulting Outreach',
      },
      subject,
      text: `${text}\n\n---\nUnsubscribe: ${unsubscribeUrl}`,
      html: htmlWithTracking || `<p>${text.replace(/\n/g, '<br>')}</p><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
      trackingSettings: {
        clickTracking: {
          enable: true,
        },
        openTracking: {
          enable: true,
        },
      },
      customArgs: {
        activity_id: activityId.toString(),
        contact_id: contactId.toString(),
        campaign_id: campaignId ? campaignId.toString() : '',
      },
    };

    // Send via SendGrid (in development, just log)
    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
      const response = await sgMail.send(msg);

      // Update activity with sent status
      await query(
        `UPDATE email_activities
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP, message_id = $1
         WHERE id = $2`,
        [response[0].headers['x-message-id'], activityId]
      );

      logger.info('Email sent successfully', {
        to,
        activityId,
        messageId: response[0].headers['x-message-id'],
      });
    } else {
      // In development, just mark as sent
      await query(
        `UPDATE email_activities
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [activityId]
      );

      logger.info('Email logged (dev mode)', { to, activityId, subject });
    }

    // Update contact last contacted
    await query(
      'UPDATE contacts SET last_contacted = CURRENT_TIMESTAMP WHERE id = $1',
      [contactId]
    );

    return {
      success: true,
      activityId,
    };
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to });

    // Update activity with failed status if activityId exists
    if (error.activityId) {
      await query(
        `UPDATE email_activities
         SET status = 'failed'
         WHERE id = $1`,
        [error.activityId]
      );
    }

    throw error;
  }
};

// Process email webhook (SendGrid events)
const processEmailWebhook = async (events) => {
  try {
    for (const event of events) {
      const activityId = event.activity_id;
      if (!activityId) continue;

      const eventType = event.event;

      switch (eventType) {
        case 'delivered':
          await query(
            `UPDATE email_activities SET status = 'delivered' WHERE id = $1`,
            [activityId]
          );
          break;

        case 'open':
          await query(
            `UPDATE email_activities
             SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
                 open_count = open_count + 1
             WHERE id = $1`,
            [activityId]
          );

          // Log event
          await query(
            `INSERT INTO email_events (email_activity_id, event_type, event_data, user_agent, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [activityId, 'open', JSON.stringify(event), event.useragent, event.ip]
          );
          break;

        case 'click':
          await query(
            `UPDATE email_activities
             SET clicked_at = COALESCE(clicked_at, CURRENT_TIMESTAMP),
                 click_count = click_count + 1
             WHERE id = $1`,
            [activityId]
          );

          await query(
            `INSERT INTO email_events (email_activity_id, event_type, event_data, user_agent, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [activityId, 'click', JSON.stringify(event), event.useragent, event.ip]
          );
          break;

        case 'bounce':
          await query(
            `UPDATE email_activities
             SET bounced_at = CURRENT_TIMESTAMP, bounce_reason = $2, status = 'bounced'
             WHERE id = $1`,
            [activityId, event.reason]
          );

          // Update contact email validity
          const contactResult = await query(
            'SELECT contact_id FROM email_activities WHERE id = $1',
            [activityId]
          );
          if (contactResult.rows.length > 0) {
            await query(
              `UPDATE contacts SET email_valid = false, bounce_status = $1 WHERE id = $2`,
              [event.type, contactResult.rows[0].contact_id]
            );
          }
          break;

        case 'unsubscribe':
          await query(
            `UPDATE email_activities SET unsubscribed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [activityId]
          );

          // Mark contact as opted out
          const unsubContactResult = await query(
            'SELECT contact_id FROM email_activities WHERE id = $1',
            [activityId]
          );
          if (unsubContactResult.rows.length > 0) {
            const contactId = unsubContactResult.rows[0].contact_id;
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
          }
          break;

        case 'spamreport':
          await query(
            `INSERT INTO email_events (email_activity_id, event_type, event_data)
             VALUES ($1, $2, $3)`,
            [activityId, 'spam_report', JSON.stringify(event)]
          );
          logger.warn('Spam report received', { activityId, event });
          break;
      }
    }

    logger.info('Email webhooks processed', { count: events.length });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    throw error;
  }
};

// Verify email address
const verifyEmail = async (email) => {
  try {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // In production, you could integrate with a service like ZeroBounce or Hunter.io
    // For now, just do basic validation
    const domain = email.split('@')[1];
    const invalidDomains = ['example.com', 'test.com', 'fake.com'];

    if (invalidDomains.includes(domain)) {
      return { valid: false, reason: 'Invalid domain' };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Email verification failed', { error: error.message, email });
    return { valid: false, reason: 'Verification failed' };
  }
};

// Check daily email limit
const checkDailyLimit = async (campaignId) => {
  try {
    const result = await query(
      `SELECT daily_limit FROM campaigns WHERE id = $1`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const dailyLimit = result.rows[0].daily_limit;

    // Count emails sent today
    const countResult = await query(
      `SELECT COUNT(*) as count
       FROM email_activities
       WHERE campaign_id = $1
         AND status = 'sent'
         AND DATE(sent_at) = CURRENT_DATE`,
      [campaignId]
    );

    const sentToday = parseInt(countResult.rows[0].count);

    return {
      limit: dailyLimit,
      sent: sentToday,
      remaining: dailyLimit - sentToday,
      canSend: sentToday < dailyLimit,
    };
  } catch (error) {
    logger.error('Daily limit check failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  sendEmail,
  processEmailWebhook,
  verifyEmail,
  checkDailyLimit,
};
