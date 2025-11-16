const OpenAI = require('openai');
const { query } = require('../database/config');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate personalized email content
const generatePersonalizedEmail = async ({
  contactName,
  contactTitle,
  companyName,
  industry,
  companySize,
  aiMaturityScore,
  templateType = 'initial_outreach',
  additionalContext = '',
}) => {
  try {
    const prompt = `Generate a highly personalized cold email for an AI consulting company.

Contact Information:
- Name: ${contactName}
- Title: ${contactTitle}
- Company: ${companyName}
- Industry: ${industry}
- Company Size: ${companySize}
- AI Maturity Score: ${aiMaturityScore}/100
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

Email Type: ${templateType}

Requirements:
1. Keep it concise (150-200 words)
2. Focus on specific pain points for ${industry} industry
3. Mention relevant AI use cases
4. Include a clear call-to-action
5. Professional but conversational tone
6. Personalize based on their role as ${contactTitle}
7. Do not use overly salesy language
8. Include specific metrics or benefits

Generate ONLY the email content (subject line and body). Format as JSON:
{
  "subject": "subject line here",
  "body": "email body here"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert B2B email copywriter specializing in AI consulting outreach. You write concise, personalized emails that get responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    const emailContent = JSON.parse(response);

    logger.info('AI email generated', {
      companyName,
      templateType,
      tokensUsed: completion.usage.total_tokens,
    });

    return emailContent;
  } catch (error) {
    logger.error('AI email generation failed', { error: error.message });
    throw new Error('Failed to generate personalized email');
  }
};

// Generate subject line variations for A/B testing
const generateSubjectLineVariations = async (originalSubject, companyName, industry) => {
  try {
    const prompt = `Generate 3 alternative subject lines for a cold email.

Original: "${originalSubject}"
Company: ${companyName}
Industry: ${industry}

Requirements:
- Each should be different in approach (value-focused, curiosity-driven, personalized)
- Keep under 60 characters
- No spam trigger words
- Professional tone

Return as JSON array: ["subject1", "subject2", "subject3"]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing high-converting email subject lines.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;
    const variations = JSON.parse(response);

    return variations;
  } catch (error) {
    logger.error('Subject line generation failed', { error: error.message });
    throw new Error('Failed to generate subject line variations');
  }
};

// Analyze company for AI readiness
const analyzeCompanyAIReadiness = async (companyData) => {
  try {
    const prompt = `Analyze this company's AI readiness and suggest personalized talking points.

Company Information:
${JSON.stringify(companyData, null, 2)}

Provide:
1. AI Maturity Score (0-100)
2. Top 3 AI opportunities specific to their industry
3. Potential pain points AI could solve
4. Recommended approach for outreach

Return as JSON:
{
  "ai_maturity_score": number,
  "opportunities": ["opp1", "opp2", "opp3"],
  "pain_points": ["pain1", "pain2", "pain3"],
  "approach": "recommended approach description"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI consultant analyzing companies for AI transformation potential.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const response = completion.choices[0].message.content;
    const analysis = JSON.parse(response);

    logger.info('Company AI readiness analyzed', {
      companyName: companyData.name,
      score: analysis.ai_maturity_score,
    });

    return analysis;
  } catch (error) {
    logger.error('Company analysis failed', { error: error.message });
    throw new Error('Failed to analyze company');
  }
};

// Generate follow-up email based on previous interaction
const generateFollowUpEmail = async ({
  contactName,
  companyName,
  previousEmailSubject,
  previousEmailBody,
  daysSinceLast,
  hasOpened,
  hasClicked,
}) => {
  try {
    const interactionContext = hasClicked
      ? 'They clicked on links in the previous email'
      : hasOpened
      ? 'They opened the previous email but did not click'
      : 'They did not open the previous email';

    const prompt = `Generate a follow-up email for an AI consulting outreach campaign.

Contact: ${contactName} at ${companyName}
Days since last email: ${daysSinceLast}
Previous email subject: "${previousEmailSubject}"
Interaction: ${interactionContext}

Previous email body:
${previousEmailBody}

Requirements:
1. Acknowledge they may be busy
2. Add new value (insight, case study, or resource)
3. Keep it shorter than the original (100-150 words)
4. Different angle from previous email
5. Clear, simple call-to-action
6. Professional but friendly tone

Generate ONLY the email content. Format as JSON:
{
  "subject": "subject line here",
  "body": "email body here"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing compelling follow-up emails that get responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const response = completion.choices[0].message.content;
    const emailContent = JSON.parse(response);

    logger.info('Follow-up email generated', { companyName });

    return emailContent;
  } catch (error) {
    logger.error('Follow-up email generation failed', { error: error.message });
    throw new Error('Failed to generate follow-up email');
  }
};

// Classify email reply sentiment
const classifyReplySentiment = async (replyText) => {
  try {
    const prompt = `Classify the sentiment and intent of this email reply.

Reply: "${replyText}"

Return as JSON:
{
  "sentiment": "positive|neutral|negative|not_interested",
  "intent": "meeting_request|more_info|objection|unsubscribe|other",
  "requires_action": true|false,
  "suggested_response": "brief suggestion for how to respond"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing email replies for sales outreach.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;
    const classification = JSON.parse(response);

    return classification;
  } catch (error) {
    logger.error('Reply classification failed', { error: error.message });
    throw new Error('Failed to classify reply');
  }
};

module.exports = {
  generatePersonalizedEmail,
  generateSubjectLineVariations,
  analyzeCompanyAIReadiness,
  generateFollowUpEmail,
  classifyReplySentiment,
};
