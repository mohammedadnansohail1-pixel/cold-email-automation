const axios = require('axios');
const { query } = require('../database/config');
const logger = require('../utils/logger');

// Enrich company data using Apollo.io API
const enrichCompanyFromApollo = async (domain) => {
  try {
    if (!process.env.APOLLO_API_KEY || process.env.APOLLO_API_KEY === 'your_apollo_api_key_here') {
      logger.warn('Apollo API key not configured, skipping enrichment');
      return null;
    }

    const response = await axios.get('https://api.apollo.io/v1/organizations/enrich', {
      params: { domain },
      headers: {
        'X-Api-Key': process.env.APOLLO_API_KEY,
      },
    });

    const data = response.data.organization;

    const enrichmentData = {
      name: data.name,
      industry: data.industry,
      employee_count: data.estimated_num_employees,
      revenue_range: data.estimated_annual_revenue,
      website: data.website_url,
      headquarters_location: `${data.city}, ${data.state}, ${data.country}`,
      description: data.short_description,
      linkedin_url: data.linkedin_url,
      founded_year: data.founded_year,
      tech_stack: data.technologies || [],
    };

    logger.info('Company enriched from Apollo', { domain });

    return enrichmentData;
  } catch (error) {
    logger.error('Apollo enrichment failed', {
      error: error.message,
      domain,
    });
    return null;
  }
};

// Enrich company data using Clearbit API
const enrichCompanyFromClearbit = async (domain) => {
  try {
    if (!process.env.CLEARBIT_API_KEY || process.env.CLEARBIT_API_KEY === 'your_clearbit_api_key_here') {
      logger.warn('Clearbit API key not configured, skipping enrichment');
      return null;
    }

    const response = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
      params: { domain },
      headers: {
        Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}`,
      },
    });

    const data = response.data;

    const enrichmentData = {
      name: data.name,
      industry: data.category?.industry,
      employee_count: data.metrics?.employees,
      revenue_range: data.metrics?.estimatedAnnualRevenue,
      website: data.domain,
      headquarters_location: `${data.geo?.city}, ${data.geo?.state}, ${data.geo?.country}`,
      description: data.description,
      linkedin_url: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : null,
      founded_year: data.foundedYear,
      tech_stack: data.tech || [],
    };

    logger.info('Company enriched from Clearbit', { domain });

    return enrichmentData;
  } catch (error) {
    logger.error('Clearbit enrichment failed', {
      error: error.message,
      domain,
    });
    return null;
  }
};

// Find decision makers at a company
const findDecisionMakers = async (domain, titles = ['CTO', 'CDO', 'VP']) => {
  try {
    if (!process.env.APOLLO_API_KEY || process.env.APOLLO_API_KEY === 'your_apollo_api_key_here') {
      logger.warn('Apollo API key not configured, skipping decision maker search');
      return [];
    }

    const response = await axios.post(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        organization_domains: [domain],
        person_titles: titles,
        page: 1,
        per_page: 10,
      },
      {
        headers: {
          'X-Api-Key': process.env.APOLLO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const contacts = response.data.people.map(person => ({
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      title: person.title,
      linkedin_url: person.linkedin_url,
      department: person.departments?.[0],
      seniority_level: person.seniority,
    }));

    logger.info('Decision makers found', {
      domain,
      count: contacts.length,
    });

    return contacts;
  } catch (error) {
    logger.error('Decision maker search failed', {
      error: error.message,
      domain,
    });
    return [];
  }
};

// Enrich and update company in database
const enrichAndUpdateCompany = async (companyId) => {
  try {
    // Get company domain
    const companyResult = await query(
      'SELECT domain FROM companies WHERE id = $1',
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      throw new Error('Company not found');
    }

    const domain = companyResult.rows[0].domain;

    // Try Apollo first, fall back to Clearbit
    let enrichmentData = await enrichCompanyFromApollo(domain);
    if (!enrichmentData) {
      enrichmentData = await enrichCompanyFromClearbit(domain);
    }

    if (!enrichmentData) {
      logger.warn('No enrichment data available', { companyId, domain });
      return null;
    }

    // Update company with enriched data
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(enrichmentData).forEach(key => {
      if (enrichmentData[key] !== null && enrichmentData[key] !== undefined) {
        paramCount++;
        if (key === 'tech_stack') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(enrichmentData[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(enrichmentData[key]);
        }
      }
    });

    if (fields.length > 0) {
      paramCount++;
      values.push(companyId);

      await query(
        `UPDATE companies
         SET ${fields.join(', ')},
             enrichment_data = $${paramCount + 1},
             last_enriched = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}`,
        [...values, JSON.stringify(enrichmentData)]
      );

      logger.info('Company updated with enrichment data', { companyId });
    }

    return enrichmentData;
  } catch (error) {
    logger.error('Company enrichment and update failed', {
      error: error.message,
      companyId,
    });
    throw error;
  }
};

// Scrape company website for insights
const scrapeCompanyWebsite = async (url) => {
  try {
    // Basic web scraping using axios and cheerio
    const cheerio = require('cheerio');
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Cold-Email-Bot/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract basic info
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';

    // Look for AI-related keywords
    const bodyText = $('body').text().toLowerCase();
    const aiKeywords = ['artificial intelligence', 'machine learning', 'ai', 'ml', 'data science', 'automation'];
    const hasAIContent = aiKeywords.some(keyword => bodyText.includes(keyword));

    const insights = {
      title,
      description,
      keywords,
      has_ai_content: hasAIContent,
      scraped_at: new Date(),
    };

    logger.info('Website scraped', { url });

    return insights;
  } catch (error) {
    logger.error('Website scraping failed', {
      error: error.message,
      url,
    });
    return null;
  }
};

// Calculate AI maturity score
const calculateAIMaturityScore = async (companyId) => {
  try {
    const companyResult = await query(
      'SELECT * FROM companies WHERE id = $1',
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      throw new Error('Company not found');
    }

    const company = companyResult.rows[0];
    let score = 0;

    // Tech stack analysis (max 40 points)
    const techStack = company.tech_stack || [];
    const aiTech = ['Python', 'TensorFlow', 'PyTorch', 'Kubernetes', 'AWS SageMaker', 'Azure ML'];
    const modernTech = ['React', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker'];

    const aiTechCount = techStack.filter(tech => aiTech.some(ai => tech.includes(ai))).length;
    const modernTechCount = techStack.filter(tech => modernTech.some(modern => tech.includes(modern))).length;

    score += Math.min(aiTechCount * 10, 30); // Up to 30 points for AI tech
    score += Math.min(modernTechCount * 2, 10); // Up to 10 points for modern tech

    // Company size (max 20 points)
    const employeeCount = company.employee_count || 0;
    if (employeeCount >= 1000) score += 20;
    else if (employeeCount >= 500) score += 15;
    else if (employeeCount >= 100) score += 10;
    else score += 5;

    // Industry (max 20 points)
    const highAIIndustries = ['Finance', 'Technology', 'Healthcare', 'E-commerce'];
    if (highAIIndustries.includes(company.industry)) {
      score += 20;
    } else {
      score += 10;
    }

    // Website analysis (max 20 points)
    if (company.enrichment_data?.has_ai_content) {
      score += 20;
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Update company score
    await query(
      'UPDATE companies SET ai_maturity_score = $1 WHERE id = $2',
      [score, companyId]
    );

    logger.info('AI maturity score calculated', { companyId, score });

    return score;
  } catch (error) {
    logger.error('AI maturity score calculation failed', {
      error: error.message,
      companyId,
    });
    throw error;
  }
};

module.exports = {
  enrichCompanyFromApollo,
  enrichCompanyFromClearbit,
  findDecisionMakers,
  enrichAndUpdateCompany,
  scrapeCompanyWebsite,
  calculateAIMaturityScore,
};
