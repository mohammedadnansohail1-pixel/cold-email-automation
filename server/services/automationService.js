const cron = require('node-cron');
const { query } = require('../database/config');
const emailService = require('./emailService');
const aiService = require('./aiService');
const logger = require('../utils/logger');

// Process pending campaign emails
const processCampaignEmails = async () => {
  try {
    logger.info('Starting campaign email processing...');

    // Get active campaigns
    const campaignsResult = await query(
      `SELECT * FROM campaigns WHERE status = 'active'`
    );

    for (const campaign of campaignsResult.rows) {
      // Check daily limit
      const limitCheck = await emailService.checkDailyLimit(campaign.id);

      if (!limitCheck.canSend) {
        logger.info('Daily limit reached for campaign', {
          campaignId: campaign.id,
          limit: limitCheck.limit,
        });
        continue;
      }

      // Get pending contacts for this campaign
      const contactsResult = await query(
        `SELECT cc.*, c.*, co.name as company_name, co.industry, co.size as company_size,
                co.ai_maturity_score
         FROM campaign_contacts cc
         JOIN contacts c ON cc.contact_id = c.id
         LEFT JOIN companies co ON c.company_id = co.id
         WHERE cc.campaign_id = $1
           AND cc.status = 'pending'
           AND c.opted_out = false
           AND c.email_valid = true
         ORDER BY c.score DESC
         LIMIT $2`,
        [campaign.id, limitCheck.remaining]
      );

      logger.info('Processing contacts for campaign', {
        campaignId: campaign.id,
        contactCount: contactsResult.rows.length,
      });

      const sequenceData = campaign.sequence_data || [];

      for (const contact of contactsResult.rows) {
        try {
          // Get current sequence step
          const currentStep = contact.current_step || 0;

          if (currentStep >= sequenceData.length) {
            // Mark as completed
            await query(
              `UPDATE campaign_contacts SET status = 'completed' WHERE id = $1`,
              [contact.id]
            );
            continue;
          }

          const stepData = sequenceData[currentStep];
          const delayDays = stepData.delay_days || 0;

          // Check if enough time has passed since last action
          if (contact.last_action_at) {
            const daysSinceLastAction = Math.floor(
              (Date.now() - new Date(contact.last_action_at).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastAction < delayDays) {
              continue; // Not time yet
            }
          }

          // Generate personalized email using AI
          const emailContent = await aiService.generatePersonalizedEmail({
            contactName: `${contact.first_name} ${contact.last_name}`,
            contactTitle: contact.title,
            companyName: contact.company_name,
            industry: contact.industry,
            companySize: contact.company_size,
            aiMaturityScore: contact.ai_maturity_score,
            templateType: currentStep === 0 ? 'initial_outreach' : 'follow_up',
          });

          // Send email
          await emailService.sendEmail({
            to: contact.email,
            subject: emailContent.subject,
            text: emailContent.body,
            html: emailContent.body.replace(/\n/g, '<br>'),
            contactId: contact.contact_id,
            campaignId: campaign.id,
            templateId: stepData.template_id,
            sequenceStep: currentStep,
          });

          // Update campaign contact
          await query(
            `UPDATE campaign_contacts
             SET current_step = $1, last_action_at = CURRENT_TIMESTAMP, status = 'active'
             WHERE id = $2`,
            [currentStep + 1, contact.id]
          );

          logger.info('Email sent in campaign', {
            campaignId: campaign.id,
            contactEmail: contact.email,
            step: currentStep,
          });

          // Add delay between emails to avoid spam
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          logger.error('Failed to process contact in campaign', {
            error: error.message,
            contactId: contact.contact_id,
            campaignId: campaign.id,
          });
        }
      }
    }

    logger.info('Campaign email processing completed');
  } catch (error) {
    logger.error('Campaign processing failed', { error: error.message });
  }
};

// Process follow-ups based on engagement
const processFollowUps = async () => {
  try {
    logger.info('Processing follow-ups...');

    // Find contacts who opened but didn't reply
    const result = await query(
      `SELECT DISTINCT ea.contact_id, c.*, co.name as company_name,
              ea.subject_line, ea.body_text, ea.campaign_id,
              EXTRACT(DAY FROM CURRENT_TIMESTAMP - ea.opened_at) as days_since_open
       FROM email_activities ea
       JOIN contacts c ON ea.contact_id = c.id
       LEFT JOIN companies co ON c.company_id = co.id
       WHERE ea.opened_at IS NOT NULL
         AND ea.replied_at IS NULL
         AND ea.campaign_id IS NOT NULL
         AND c.opted_out = false
         AND EXTRACT(DAY FROM CURRENT_TIMESTAMP - ea.opened_at) >= 3
         AND EXTRACT(DAY FROM CURRENT_TIMESTAMP - ea.opened_at) <= 5
         AND NOT EXISTS (
           SELECT 1 FROM email_activities ea2
           WHERE ea2.contact_id = ea.contact_id
             AND ea2.sent_at > ea.sent_at
         )
       LIMIT 10`
    );

    for (const contact of result.rows) {
      try {
        // Generate follow-up email
        const followUpContent = await aiService.generateFollowUpEmail({
          contactName: `${contact.first_name} ${contact.last_name}`,
          companyName: contact.company_name,
          previousEmailSubject: contact.subject_line,
          previousEmailBody: contact.body_text,
          daysSinceLast: parseInt(contact.days_since_open),
          hasOpened: true,
          hasClicked: false,
        });

        // Send follow-up
        await emailService.sendEmail({
          to: contact.email,
          subject: followUpContent.subject,
          text: followUpContent.body,
          html: followUpContent.body.replace(/\n/g, '<br>'),
          contactId: contact.contact_id,
          campaignId: contact.campaign_id,
          sequenceStep: 99, // Special step for auto-follow-ups
        });

        logger.info('Follow-up sent', {
          contactEmail: contact.email,
          daysSinceOpen: contact.days_since_open,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error('Failed to send follow-up', {
          error: error.message,
          contactId: contact.contact_id,
        });
      }
    }

    logger.info('Follow-up processing completed');
  } catch (error) {
    logger.error('Follow-up processing failed', { error: error.message });
  }
};

// Update analytics daily
const updateAnalytics = async () => {
  try {
    logger.info('Updating analytics...');

    const campaignsResult = await query('SELECT id FROM campaigns');

    for (const campaign of campaignsResult.rows) {
      await query(
        `INSERT INTO analytics (
          campaign_id, date, emails_sent, emails_delivered, emails_opened,
          emails_clicked, emails_replied, emails_bounced, emails_unsubscribed
        )
        SELECT
          campaign_id,
          CURRENT_DATE,
          COUNT(CASE WHEN status = 'sent' THEN 1 END),
          COUNT(CASE WHEN status = 'delivered' THEN 1 END),
          COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END),
          COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END),
          COUNT(CASE WHEN replied_at IS NOT NULL THEN 1 END),
          COUNT(CASE WHEN bounced_at IS NOT NULL THEN 1 END),
          COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END)
        FROM email_activities
        WHERE campaign_id = $1
          AND DATE(sent_at) = CURRENT_DATE
        GROUP BY campaign_id
        ON CONFLICT (campaign_id, date)
        DO UPDATE SET
          emails_sent = EXCLUDED.emails_sent,
          emails_delivered = EXCLUDED.emails_delivered,
          emails_opened = EXCLUDED.emails_opened,
          emails_clicked = EXCLUDED.emails_clicked,
          emails_replied = EXCLUDED.emails_replied,
          emails_bounced = EXCLUDED.emails_bounced,
          emails_unsubscribed = EXCLUDED.emails_unsubscribed`,
        [campaign.id]
      );
    }

    logger.info('Analytics updated successfully');
  } catch (error) {
    logger.error('Analytics update failed', { error: error.message });
  }
};

// Schedule automated tasks
const startAutomation = () => {
  // Process campaign emails every 30 minutes
  cron.schedule('*/30 * * * *', processCampaignEmails);
  logger.info('Scheduled: Campaign email processing (every 30 minutes)');

  // Process follow-ups daily at 10 AM
  cron.schedule('0 10 * * *', processFollowUps);
  logger.info('Scheduled: Follow-up processing (daily at 10 AM)');

  // Update analytics daily at midnight
  cron.schedule('0 0 * * *', updateAnalytics);
  logger.info('Scheduled: Analytics update (daily at midnight)');

  logger.info('✓ Automation system started');
};

module.exports = {
  startAutomation,
  processCampaignEmails,
  processFollowUps,
  updateAnalytics,
};
