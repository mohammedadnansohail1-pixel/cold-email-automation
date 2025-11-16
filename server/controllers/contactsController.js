const { query } = require('../database/config');
const logger = require('../utils/logger');

// Get all contacts with filters
const getContacts = async (req, res, next) => {
  try {
    const {
      company_id,
      seniority_level,
      department,
      min_score,
      opted_out,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (company_id) {
      paramCount++;
      whereConditions.push(`c.company_id = $${paramCount}`);
      params.push(company_id);
    }

    if (seniority_level) {
      paramCount++;
      whereConditions.push(`c.seniority_level = $${paramCount}`);
      params.push(seniority_level);
    }

    if (department) {
      paramCount++;
      whereConditions.push(`c.department = $${paramCount}`);
      params.push(department);
    }

    if (min_score) {
      paramCount++;
      whereConditions.push(`c.score >= $${paramCount}`);
      params.push(min_score);
    }

    if (opted_out !== undefined) {
      paramCount++;
      whereConditions.push(`c.opted_out = $${paramCount}`);
      params.push(opted_out === 'true');
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM contacts c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results with company info
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push((page - 1) * limit);

    const result = await query(
      `SELECT c.*,
        comp.name as company_name,
        comp.industry as company_industry,
        (SELECT COUNT(*) FROM email_activities WHERE contact_id = c.id) as email_count
       FROM contacts c
       LEFT JOIN companies comp ON c.company_id = comp.id
       ${whereClause}
       ORDER BY c.score DESC, c.created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    res.json({
      contacts: result.rows,
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

// Get single contact
const getContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*,
        comp.name as company_name,
        comp.industry as company_industry,
        comp.website as company_website,
        (SELECT json_agg(ea ORDER BY ea.sent_at DESC)
         FROM email_activities ea
         WHERE ea.contact_id = c.id) as email_history
       FROM contacts c
       LEFT JOIN companies comp ON c.company_id = comp.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Create contact
const createContact = async (req, res, next) => {
  try {
    const data = req.validatedData;

    const result = await query(
      `INSERT INTO contacts (company_id, email, first_name, last_name, title,
                            department, seniority_level, linkedin_url, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [data.company_id, data.email, data.first_name, data.last_name, data.title,
       data.department, data.seniority_level, data.linkedin_url, data.phone]
    );

    logger.info('Contact created', { contactId: result.rows[0].id });

    res.status(201).json({
      message: 'Contact created successfully',
      contact: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update contact
const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    values.push(id);

    const result = await query(
      `UPDATE contacts
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    logger.info('Contact updated', { contactId: id });

    res.json({
      message: 'Contact updated successfully',
      contact: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete contact
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM contacts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    logger.info('Contact deleted', { contactId: id });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bulk import contacts
const bulkImportContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts array is required' });
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [],
    };

    for (const contact of contacts) {
      try {
        await query(
          `INSERT INTO contacts (company_id, email, first_name, last_name, title,
                                department, seniority_level, linkedin_url, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [contact.company_id, contact.email, contact.first_name, contact.last_name,
           contact.title, contact.department, contact.seniority_level,
           contact.linkedin_url, contact.phone]
        );
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: contact.email,
          error: error.message,
        });
      }
    }

    logger.info('Bulk contact import completed', results);

    res.json({
      message: 'Bulk import completed',
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Opt out contact
const optOutContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, feedback } = req.body;

    // Update contact
    await query(
      `UPDATE contacts
       SET opted_out = true, opted_out_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // Record in unsubscribes table
    await query(
      `INSERT INTO unsubscribes (contact_id, reason, feedback)
       VALUES ($1, $2, $3)
       ON CONFLICT (contact_id) DO UPDATE
       SET reason = $2, feedback = $3, unsubscribed_at = CURRENT_TIMESTAMP`,
      [id, reason, feedback]
    );

    logger.info('Contact opted out', { contactId: id });

    res.json({ message: 'Contact opted out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  bulkImportContacts,
  optOutContact,
};
