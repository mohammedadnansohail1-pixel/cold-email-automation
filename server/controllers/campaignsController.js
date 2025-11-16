const { query, transaction } = require('../database/config');
const logger = require('../utils/logger');

// Get all campaigns
const getCampaigns = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    let whereConditions = [`user_id = $1`];
    let params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM campaigns ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push((page - 1) * limit);

    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = c.id) as total_contacts,
        (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = c.id AND status = 'completed') as completed_contacts,
        (SELECT COUNT(*) FROM email_activities WHERE campaign_id = c.id AND status = 'sent') as emails_sent
       FROM campaigns c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    res.json({
      campaigns: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single campaign
const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT c.*,
        (SELECT json_agg(cc ORDER BY cc.added_at)
         FROM campaign_contacts cc
         LEFT JOIN contacts con ON cc.contact_id = con.id
         WHERE cc.campaign_id = c.id) as contacts,
        (SELECT json_agg(ea ORDER BY ea.sent_at DESC)
         FROM email_activities ea
         WHERE ea.campaign_id = c.id
         LIMIT 100) as recent_activities
       FROM campaigns c
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Create campaign
const createCampaign = async (req, res, next) => {
  try {
    const data = req.validatedData;
    const userId = req.user.id;

    const result = await query(
      `INSERT INTO campaigns (user_id, name, description, campaign_type, target_industry,
                             target_company_size, target_titles, sequence_data, daily_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, data.name, data.description, data.campaign_type, data.target_industry,
       data.target_company_size, JSON.stringify(data.target_titles || []),
       JSON.stringify(data.sequence_data || []), data.daily_limit]
    );

    logger.info('Campaign created', { campaignId: result.rows[0].id, userId });

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update campaign
const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user.id;

    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        paramCount++;
        if (key === 'target_titles' || key === 'sequence_data' || key === 'settings') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(data[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(data[key]);
        }
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    values.push(id);
    paramCount++;
    values.push(userId);

    const result = await query(
      `UPDATE campaigns
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    logger.info('Campaign updated', { campaignId: id, userId });

    res.json({
      message: 'Campaign updated successfully',
      campaign: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete campaign
const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM campaigns WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    logger.info('Campaign deleted', { campaignId: id, userId });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add contacts to campaign
const addContactsToCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contact_ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    // Verify campaign ownership
    const campaignCheck = await query(
      'SELECT id FROM campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const results = {
      added: 0,
      failed: 0,
      errors: [],
    };

    for (const contactId of contact_ids) {
      try {
        await query(
          `INSERT INTO campaign_contacts (campaign_id, contact_id, status, current_step)
           VALUES ($1, $2, 'pending', 0)
           ON CONFLICT (campaign_id, contact_id) DO NOTHING`,
          [id, contactId]
        );
        results.added++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          contact_id: contactId,
          error: error.message,
        });
      }
    }

    logger.info('Contacts added to campaign', { campaignId: id, ...results });

    res.json({
      message: 'Contacts processed',
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Start campaign
const startCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE campaigns
       SET status = 'active', start_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'draft'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found or already started' });
    }

    logger.info('Campaign started', { campaignId: id, userId });

    res.json({
      message: 'Campaign started successfully',
      campaign: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Pause campaign
const pauseCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE campaigns
       SET status = 'paused', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found or not active' });
    }

    logger.info('Campaign paused', { campaignId: id, userId });

    res.json({
      message: 'Campaign paused successfully',
      campaign: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get campaign analytics
const getCampaignAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify campaign ownership
    const campaignCheck = await query(
      'SELECT id FROM campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get email stats
    const emailStats = await query(
      `SELECT
        COUNT(*) as total_emails,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
        COUNT(CASE WHEN replied_at IS NOT NULL THEN 1 END) as replied,
        COUNT(CASE WHEN bounced_at IS NOT NULL THEN 1 END) as bounced,
        COUNT(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 END) as unsubscribed
       FROM email_activities
       WHERE campaign_id = $1`,
      [id]
    );

    // Get daily stats for the last 30 days
    const dailyStats = await query(
      `SELECT
        date,
        emails_sent,
        emails_opened,
        emails_clicked,
        emails_replied
       FROM analytics
       WHERE campaign_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [id]
    );

    // Calculate rates
    const stats = emailStats.rows[0];
    const sent = parseInt(stats.sent) || 0;

    const analytics = {
      total_emails: parseInt(stats.total_emails),
      sent,
      delivered: parseInt(stats.delivered),
      opened: parseInt(stats.opened),
      clicked: parseInt(stats.clicked),
      replied: parseInt(stats.replied),
      bounced: parseInt(stats.bounced),
      unsubscribed: parseInt(stats.unsubscribed),
      open_rate: sent > 0 ? ((parseInt(stats.opened) / sent) * 100).toFixed(2) : 0,
      click_rate: sent > 0 ? ((parseInt(stats.clicked) / sent) * 100).toFixed(2) : 0,
      reply_rate: sent > 0 ? ((parseInt(stats.replied) / sent) * 100).toFixed(2) : 0,
      bounce_rate: sent > 0 ? ((parseInt(stats.bounced) / sent) * 100).toFixed(2) : 0,
      daily_stats: dailyStats.rows,
    };

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addContactsToCampaign,
  startCampaign,
  pauseCampaign,
  getCampaignAnalytics,
};
