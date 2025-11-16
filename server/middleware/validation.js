const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ errors });
    }

    req.validatedData = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createCompany: Joi.object({
    name: Joi.string().required(),
    domain: Joi.string().required(),
    industry: Joi.string().optional(),
    size: Joi.string().optional(),
    employee_count: Joi.number().optional(),
    revenue_range: Joi.string().optional(),
    website: Joi.string().uri().optional(),
    headquarters_location: Joi.string().optional(),
    description: Joi.string().optional(),
  }),

  createContact: Joi.object({
    company_id: Joi.number().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    title: Joi.string().optional(),
    department: Joi.string().optional(),
    seniority_level: Joi.string().optional(),
    linkedin_url: Joi.string().uri().optional(),
    phone: Joi.string().optional(),
  }),

  createCampaign: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    campaign_type: Joi.string().valid('email', 'linkedin').default('email'),
    target_industry: Joi.string().optional(),
    target_company_size: Joi.string().optional(),
    target_titles: Joi.array().items(Joi.string()).optional(),
    sequence_data: Joi.array().items(Joi.object()).optional(),
    daily_limit: Joi.number().min(1).max(1000).default(50),
  }),

  createTemplate: Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    industry: Joi.string().optional(),
    subject_line: Joi.string().required(),
    body_text: Joi.string().required(),
    body_html: Joi.string().optional(),
  }),
};

module.exports = {
  validate,
  schemas,
};
