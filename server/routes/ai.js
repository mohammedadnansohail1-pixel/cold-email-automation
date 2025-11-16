const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { query } = require('../database/config');

// All routes require authentication
router.use(authenticateToken);

// POST /api/ai/generate-email
router.post('/generate-email', async (req, res, next) => {
  try {
    const {
      contact_id,
      template_type = 'initial_outreach',
      additional_context = '',
    } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: 'contact_id is required' });
    }

    // Get contact and company data
    const result = await query(
      `SELECT c.*, co.name as company_name, co.industry, co.size as company_size,
              co.ai_maturity_score
       FROM contacts c
       LEFT JOIN companies co ON c.company_id = co.id
       WHERE c.id = $1`,
      [contact_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = result.rows[0];

    const emailContent = await aiService.generatePersonalizedEmail({
      contactName: `${contact.first_name} ${contact.last_name}`,
      contactTitle: contact.title,
      companyName: contact.company_name,
      industry: contact.industry,
      companySize: contact.company_size,
      aiMaturityScore: contact.ai_maturity_score,
      templateType: template_type,
      additionalContext: additional_context,
    });

    res.json({ email: emailContent });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/generate-subject-variations
router.post('/generate-subject-variations', async (req, res, next) => {
  try {
    const { original_subject, company_name, industry } = req.body;

    if (!original_subject) {
      return res.status(400).json({ error: 'original_subject is required' });
    }

    const variations = await aiService.generateSubjectLineVariations(
      original_subject,
      company_name,
      industry
    );

    res.json({ variations });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/analyze-company
router.post('/analyze-company', async (req, res, next) => {
  try {
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    // Get company data
    const result = await query('SELECT * FROM companies WHERE id = $1', [company_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const analysis = await aiService.analyzeCompanyAIReadiness(result.rows[0]);

    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/classify-reply
router.post('/classify-reply', async (req, res, next) => {
  try {
    const { reply_text } = req.body;

    if (!reply_text) {
      return res.status(400).json({ error: 'reply_text is required' });
    }

    const classification = await aiService.classifyReplySentiment(reply_text);

    res.json({ classification });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
