const { query } = require('../database/config');
const logger = require('../utils/logger');

// Get all companies with filters
const getCompanies = async (req, res, next) => {
  try {
    const {
      industry,
      size,
      min_score,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (industry) {
      paramCount++;
      whereConditions.push(`industry = $${paramCount}`);
      params.push(industry);
    }

    if (size) {
      paramCount++;
      whereConditions.push(`size = $${paramCount}`);
      params.push(size);
    }

    if (min_score) {
      paramCount++;
      whereConditions.push(`ai_maturity_score >= $${paramCount}`);
      params.push(min_score);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR domain ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM companies ${whereClause}`,
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
        (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count
       FROM companies c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    res.json({
      companies: result.rows,
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

// Get single company
const getCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*,
        (SELECT json_agg(contacts.*) FROM contacts WHERE company_id = c.id) as contacts
       FROM companies c
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Create company
const createCompany = async (req, res, next) => {
  try {
    const data = req.validatedData;

    const result = await query(
      `INSERT INTO companies (name, domain, industry, size, employee_count, revenue_range,
                             website, headquarters_location, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [data.name, data.domain, data.industry, data.size, data.employee_count,
       data.revenue_range, data.website, data.headquarters_location, data.description]
    );

    logger.info('Company created', { companyId: result.rows[0].id });

    res.status(201).json({
      message: 'Company created successfully',
      company: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update company
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const fields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic UPDATE query
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
      `UPDATE companies
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    logger.info('Company updated', { companyId: id });

    res.json({
      message: 'Company updated successfully',
      company: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete company
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    logger.info('Company deleted', { companyId: id });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get company statistics
const getCompanyStats = async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_companies,
        COUNT(DISTINCT industry) as unique_industries,
        AVG(ai_maturity_score) as avg_ai_maturity,
        COUNT(CASE WHEN size = '1000+' THEN 1 END) as large_companies,
        COUNT(CASE WHEN size = '500-999' THEN 1 END) as medium_companies,
        COUNT(CASE WHEN size = '100-499' THEN 1 END) as small_companies
      FROM companies
    `);

    const industryBreakdown = await query(`
      SELECT industry, COUNT(*) as count
      FROM companies
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
    `);

    res.json({
      stats: stats.rows[0],
      industry_breakdown: industryBreakdown.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
};
