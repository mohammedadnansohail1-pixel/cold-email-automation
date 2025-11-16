const bcrypt = require('bcryptjs');
const { pool } = require('./config');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@example.com', hashedPassword, 'Admin', 'User', 'admin']);

    console.log('✓ Created default admin user (admin@example.com / admin123)');

    // Seed sample companies
    const companies = [
      {
        name: 'TechCorp Industries',
        domain: 'techcorp.example.com',
        industry: 'Finance',
        size: '500-999',
        employee_count: 750,
        revenue_range: '$50M-$100M',
        website: 'https://techcorp.example.com',
        headquarters_location: 'New York, NY',
        tech_stack: JSON.stringify(['Python', 'PostgreSQL', 'React', 'AWS']),
        ai_maturity_score: 65,
        description: 'Leading financial technology company specializing in digital banking solutions'
      },
      {
        name: 'HealthFirst Medical',
        domain: 'healthfirst.example.com',
        industry: 'Healthcare',
        size: '1000+',
        employee_count: 1500,
        revenue_range: '$100M+',
        website: 'https://healthfirst.example.com',
        headquarters_location: 'Boston, MA',
        tech_stack: JSON.stringify(['Java', 'Oracle', 'Angular', 'Azure']),
        ai_maturity_score: 45,
        description: 'Comprehensive healthcare provider network with advanced patient care systems'
      },
      {
        name: 'RetailMax Solutions',
        domain: 'retailmax.example.com',
        industry: 'Retail',
        size: '500-999',
        employee_count: 650,
        revenue_range: '$75M-$100M',
        website: 'https://retailmax.example.com',
        headquarters_location: 'Chicago, IL',
        tech_stack: JSON.stringify(['Node.js', 'MongoDB', 'Vue.js', 'GCP']),
        ai_maturity_score: 55,
        description: 'Modern e-commerce platform serving millions of customers globally'
      },
      {
        name: 'ManufacturePro Inc',
        domain: 'manufacturepro.example.com',
        industry: 'Manufacturing',
        size: '1000+',
        employee_count: 2000,
        revenue_range: '$200M+',
        website: 'https://manufacturepro.example.com',
        headquarters_location: 'Detroit, MI',
        tech_stack: JSON.stringify(['C++', 'MySQL', 'IoT Platforms']),
        ai_maturity_score: 35,
        description: 'Industrial manufacturing leader in automotive components'
      },
      {
        name: 'FinanceGenius Corp',
        domain: 'financegenius.example.com',
        industry: 'Finance',
        size: '100-499',
        employee_count: 250,
        revenue_range: '$25M-$50M',
        website: 'https://financegenius.example.com',
        headquarters_location: 'San Francisco, CA',
        tech_stack: JSON.stringify(['Python', 'PostgreSQL', 'React', 'Kubernetes']),
        ai_maturity_score: 70,
        description: 'AI-powered investment analytics platform'
      }
    ];

    for (const company of companies) {
      const result = await pool.query(`
        INSERT INTO companies (name, domain, industry, size, employee_count, revenue_range, website,
                              headquarters_location, tech_stack, ai_maturity_score, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (domain) DO NOTHING
        RETURNING id
      `, [company.name, company.domain, company.industry, company.size, company.employee_count,
          company.revenue_range, company.website, company.headquarters_location,
          company.tech_stack, company.ai_maturity_score, company.description]);

      if (result.rows.length > 0) {
        const companyId = result.rows[0].id;

        // Add sample contacts for each company
        const contacts = [
          {
            first_name: 'John',
            last_name: 'Smith',
            title: 'Chief Technology Officer',
            email: `john.smith@${company.domain}`,
            department: 'Technology',
            seniority_level: 'C-Level',
            score: 85
          },
          {
            first_name: 'Sarah',
            last_name: 'Johnson',
            title: 'VP of Innovation',
            email: `sarah.johnson@${company.domain}`,
            department: 'Innovation',
            seniority_level: 'VP',
            score: 75
          },
          {
            first_name: 'Michael',
            last_name: 'Davis',
            title: 'Chief Data Officer',
            email: `michael.davis@${company.domain}`,
            department: 'Data',
            seniority_level: 'C-Level',
            score: 90
          }
        ];

        for (const contact of contacts) {
          await pool.query(`
            INSERT INTO contacts (company_id, first_name, last_name, title, email, department,
                                 seniority_level, score, verified, email_valid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (email) DO NOTHING
          `, [companyId, contact.first_name, contact.last_name, contact.title, contact.email,
              contact.department, contact.seniority_level, contact.score, true, true]);
        }
      }
    }

    console.log('✓ Seeded sample companies and contacts');

    // Seed email templates
    const templates = [
      {
        name: 'Finance Industry - Initial Outreach',
        category: 'initial_outreach',
        industry: 'Finance',
        subject_line: 'Transform {{company_name}}\'s operations with AI',
        body_text: `Hi {{first_name}},

I noticed {{company_name}} is leading the way in {{industry}}, and I'm impressed by your recent growth.

Many finance leaders are discovering that AI can reduce operational costs by 30-40% while improving decision-making accuracy. Given your role as {{title}}, I thought this might be relevant.

We've helped companies like [Similar Company] implement AI solutions that:
• Automate routine financial processes
• Enhance fraud detection with ML models
• Provide real-time predictive analytics

Would you be open to a 15-minute conversation about how AI could impact {{company_name}}'s bottom line?

Best regards,
[Your Name]

P.S. I've included a brief case study that shows ROI within 6 months.`
      },
      {
        name: 'Healthcare Industry - Initial Outreach',
        category: 'initial_outreach',
        industry: 'Healthcare',
        subject_line: 'AI-powered patient care for {{company_name}}',
        body_text: `Hi {{first_name}},

Healthcare organizations like {{company_name}} are under increasing pressure to deliver better outcomes with limited resources.

AI is helping healthcare leaders:
• Reduce patient wait times by 40%
• Improve diagnostic accuracy by 25%
• Streamline administrative workflows

As {{title}}, you're probably already exploring ways to leverage technology for better patient care.

Could we schedule a brief call to discuss how AI could support {{company_name}}'s mission?

Best regards,
[Your Name]`
      },
      {
        name: 'Retail Industry - Initial Outreach',
        category: 'initial_outreach',
        industry: 'Retail',
        subject_line: 'Increase {{company_name}}\'s sales with AI personalization',
        body_text: `Hi {{first_name}},

The retail landscape is evolving rapidly, and AI is becoming essential for staying competitive.

Top retailers are using AI to:
• Personalize customer experiences at scale
• Optimize inventory and reduce waste by 35%
• Predict trends before competitors

I noticed {{company_name}} has {{employee_count}}+ employees - at that scale, AI can drive significant impact.

Would you be interested in a quick conversation about AI opportunities in retail?

Best regards,
[Your Name]`
      },
      {
        name: 'Manufacturing Industry - Initial Outreach',
        category: 'initial_outreach',
        industry: 'Manufacturing',
        subject_line: 'Predictive maintenance AI for {{company_name}}',
        body_text: `Hi {{first_name}},

Manufacturing leaders are using AI to revolutionize operations - reducing downtime by up to 50% and improving quality control.

For a company like {{company_name}} in the {{industry}} sector, AI can:
• Predict equipment failures before they happen
• Optimize production schedules automatically
• Reduce defects through computer vision

As {{title}}, you're likely focused on operational excellence and cost reduction.

Can we schedule 15 minutes to explore how AI could benefit {{company_name}}?

Best regards,
[Your Name]`
      },
      {
        name: 'Follow-up - Value Add',
        category: 'follow_up',
        industry: 'All',
        subject_line: 'Thought this might interest you, {{first_name}}',
        body_text: `Hi {{first_name}},

I wanted to follow up on my previous email and share a recent case study.

[Company Name] in the {{industry}} industry achieved:
• 40% reduction in operational costs
• 3x faster decision-making
• ROI in under 6 months

I thought this might resonate with the challenges {{company_name}} faces.

Still interested in that 15-minute conversation?

Best regards,
[Your Name]`
      },
      {
        name: 'Follow-up - Case Study',
        category: 'follow_up',
        industry: 'All',
        subject_line: 'Quick question about {{company_name}}\'s AI strategy',
        body_text: `Hi {{first_name}},

I realize you're busy, so I'll keep this brief.

I'm working with several {{industry}} companies on their AI initiatives and wanted to see if {{company_name}} is exploring similar opportunities.

Even if now isn't the right time, I'd love to share some insights that might be valuable for your future planning.

Would a quick 10-minute call work?

Best regards,
[Your Name]`
      },
      {
        name: 'Follow-up - Break-up',
        category: 'follow_up',
        industry: 'All',
        subject_line: 'Should I close your file?',
        body_text: `Hi {{first_name}},

I've reached out a few times about AI consulting for {{company_name}}, but haven't heard back.

I completely understand - timing might not be right, or this might not be a priority.

Before I close your file, I wanted to check one last time:

Is there any interest in exploring how AI could benefit {{company_name}}? Or should I follow up in 6 months instead?

Either way, I appreciate your time.

Best regards,
[Your Name]`
      },
      {
        name: 'Meeting Request - Direct',
        category: 'meeting_request',
        industry: 'All',
        subject_line: '15 minutes to discuss AI ROI?',
        body_text: `Hi {{first_name}},

Thanks for your interest! I'd love to discuss how AI can drive measurable results for {{company_name}}.

Here's my calendar link: [CALENDLY_LINK]

Or if you prefer, I'm available:
• Tuesday 2-4 PM EST
• Wednesday 10 AM - 12 PM EST
• Thursday 3-5 PM EST

Looking forward to our conversation!

Best regards,
[Your Name]`
      },
      {
        name: 'Re-engagement - Long Term',
        category: 'reengagement',
        industry: 'All',
        subject_line: 'Following up from {{months_ago}} months ago',
        body_text: `Hi {{first_name}},

We spoke {{months_ago}} months ago about AI consulting for {{company_name}}.

You mentioned timing wasn't quite right then. A lot has changed in the AI landscape since then, and I wanted to reconnect.

New developments that might interest you:
• [Recent AI advancement relevant to their industry]
• [New case study from similar company]
• [Updated ROI metrics]

Would it make sense to revisit this conversation?

Best regards,
[Your Name]`
      },
      {
        name: 'Referral Request',
        category: 'referral',
        industry: 'All',
        subject_line: 'Quick question about {{company_name}}',
        body_text: `Hi {{first_name}},

I've been trying to connect with the right person at {{company_name}} regarding AI consulting initiatives.

Would you be the right person to discuss this, or could you point me to someone on your team who handles:
• AI/ML strategy
• Digital transformation
• Innovation initiatives

I appreciate any guidance you can provide!

Best regards,
[Your Name]`
      }
    ];

    for (const template of templates) {
      await pool.query(`
        INSERT INTO email_templates (user_id, name, category, industry, subject_line, body_text,
                                     variables, is_active)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      `, [template.name, template.category, template.industry, template.subject_line,
          template.body_text, JSON.stringify(['first_name', 'last_name', 'company_name',
          'title', 'industry', 'employee_count']), true]);
    }

    console.log('✓ Seeded 10 email templates');

    // Seed sample campaign
    const campaignResult = await pool.query(`
      INSERT INTO campaigns (user_id, name, description, status, target_industry,
                            target_company_size, daily_limit, sequence_data)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      'Finance Sector AI Outreach Q1',
      'Targeting finance companies with 500+ employees for AI consulting',
      'draft',
      'Finance',
      '500-999',
      50,
      JSON.stringify([
        { step: 1, template_id: 1, delay_days: 0 },
        { step: 2, template_id: 5, delay_days: 3 },
        { step: 3, template_id: 6, delay_days: 7 },
        { step: 4, template_id: 7, delay_days: 14 }
      ])
    ]);

    console.log('✓ Seeded sample campaign');

    // Seed lead scoring rules
    const scoringRules = [
      {
        rule_name: 'C-Level Title',
        condition_field: 'seniority_level',
        condition_operator: 'equals',
        condition_value: 'C-Level',
        score_adjustment: 20
      },
      {
        rule_name: 'VP Level Title',
        condition_field: 'seniority_level',
        condition_operator: 'equals',
        condition_value: 'VP',
        score_adjustment: 15
      },
      {
        rule_name: 'Large Company',
        condition_field: 'employee_count',
        condition_operator: 'greater_than',
        condition_value: '1000',
        score_adjustment: 10
      },
      {
        rule_name: 'High AI Maturity',
        condition_field: 'ai_maturity_score',
        condition_operator: 'greater_than',
        condition_value: '70',
        score_adjustment: 15
      }
    ];

    for (const rule of scoringRules) {
      await pool.query(`
        INSERT INTO lead_scoring_rules (rule_name, condition_field, condition_operator,
                                       condition_value, score_adjustment, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [rule.rule_name, rule.condition_field, rule.condition_operator,
          rule.condition_value, rule.score_adjustment, true]);
    }

    console.log('✓ Seeded lead scoring rules');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log('   - 1 Admin user (admin@example.com / admin123)');
    console.log('   - 5 Companies');
    console.log('   - 15 Contacts (3 per company)');
    console.log('   - 10 Email templates');
    console.log('   - 1 Sample campaign');
    console.log('   - 4 Lead scoring rules\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
