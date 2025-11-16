#!/usr/bin/env node

/**
 * Development Tools & Utilities
 * Helpful commands for development and testing
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coldoutreach',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const commands = {
  // Database stats
  async stats() {
    console.log('📊 Database Statistics\n');

    const tables = [
      'users',
      'companies',
      'contacts',
      'campaigns',
      'email_templates',
      'email_activities',
      'unsubscribes'
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`  ${table.padEnd(20)} ${count.toString().padStart(6)} records`);
      } catch (error) {
        console.log(`  ${table.padEnd(20)} Error: ${error.message}`);
      }
    }

    console.log();
    process.exit(0);
  },

  // Clear all data
  async clear() {
    console.log('🗑️  Clearing all data...\n');

    const tables = [
      'email_events',
      'email_activities',
      'campaign_contacts',
      'unsubscribes',
      'contacts',
      'companies',
      'campaigns',
      'email_templates',
      'jobs',
      'webhooks',
      'analytics',
      'ab_tests',
      'lead_scoring_rules',
      'activity_log'
    ];

    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (error) {
        console.log(`  ✗ Error clearing ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ All data cleared\n');
    process.exit(0);
  },

  // Reset database
  async reset() {
    console.log('🔄 Resetting database...\n');

    await commands.clear();

    console.log('🌱 Reseeding database...\n');
    const { execSync } = require('child_process');
    execSync('npm run db:seed', { stdio: 'inherit' });

    console.log('\n✅ Database reset complete\n');
    process.exit(0);
  },

  // Generate test contacts
  async generateContacts(count = 10) {
    console.log(`🔧 Generating ${count} test contacts...\n`);

    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const titles = ['CTO', 'VP of Engineering', 'Chief Data Officer', 'VP of Innovation', 'Director of Technology'];
    const domains = ['techcorp.com', 'innovate.io', 'datatech.com', 'cloudsys.com', 'aicompany.com'];

    // Get a company ID
    const companyResult = await pool.query('SELECT id FROM companies LIMIT 1');
    if (companyResult.rows.length === 0) {
      console.log('❌ No companies found. Please seed the database first.');
      process.exit(1);
    }

    const companyId = companyResult.rows[0].id;
    let created = 0;

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`;

      try {
        await pool.query(
          `INSERT INTO contacts (company_id, email, first_name, last_name, title, verified, email_valid)
           VALUES ($1, $2, $3, $4, $5, true, true)`,
          [companyId, email, firstName, lastName, title]
        );
        created++;
        console.log(`  ✓ Created ${email}`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Created ${created} test contacts\n`);
    process.exit(0);
  },

  // Show campaign performance
  async campaignPerformance() {
    console.log('📈 Campaign Performance\n');

    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.status,
        COUNT(DISTINCT cc.id) as total_contacts,
        COUNT(DISTINCT CASE WHEN ea.status = 'sent' THEN ea.id END) as emails_sent,
        COUNT(DISTINCT CASE WHEN ea.opened_at IS NOT NULL THEN ea.id END) as emails_opened,
        COUNT(DISTINCT CASE WHEN ea.clicked_at IS NOT NULL THEN ea.id END) as emails_clicked,
        COUNT(DISTINCT CASE WHEN ea.replied_at IS NOT NULL THEN ea.id END) as emails_replied
      FROM campaigns c
      LEFT JOIN campaign_contacts cc ON c.id = cc.campaign_id
      LEFT JOIN email_activities ea ON c.id = ea.campaign_id
      GROUP BY c.id, c.name, c.status
      ORDER BY c.created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('  No campaigns found\n');
    } else {
      result.rows.forEach(row => {
        const openRate = row.emails_sent > 0
          ? ((row.emails_opened / row.emails_sent) * 100).toFixed(1)
          : '0.0';
        const replyRate = row.emails_sent > 0
          ? ((row.emails_replied / row.emails_sent) * 100).toFixed(1)
          : '0.0';

        console.log(`  Campaign: ${row.name}`);
        console.log(`    Status: ${row.status}`);
        console.log(`    Contacts: ${row.total_contacts}`);
        console.log(`    Sent: ${row.emails_sent}`);
        console.log(`    Opened: ${row.emails_opened} (${openRate}%)`);
        console.log(`    Clicked: ${row.emails_clicked}`);
        console.log(`    Replied: ${row.emails_replied} (${replyRate}%)`);
        console.log();
      });
    }

    process.exit(0);
  },

  // Create admin user
  async createAdmin(email, password) {
    console.log('👤 Creating admin user...\n');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password || 'admin123', 10);

    try {
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Admin', 'User', 'admin')`,
        [email || 'admin@example.com', passwordHash]
      );
      console.log(`  ✓ Created admin user: ${email || 'admin@example.com'}`);
      console.log(`  Password: ${password || 'admin123'}\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }

    process.exit(0);
  },

  // Help
  help() {
    console.log(`
AI Cold Email Automation - Development Tools

Usage: node scripts/dev-tools.js <command> [args]

Commands:
  stats                          Show database statistics
  clear                          Clear all data from database
  reset                          Clear and reseed database
  generate <count>               Generate test contacts
  performance                    Show campaign performance
  admin <email> <password>       Create admin user
  help                          Show this help message

Examples:
  node scripts/dev-tools.js stats
  node scripts/dev-tools.js generate 50
  node scripts/dev-tools.js admin admin@test.com mypassword
  node scripts/dev-tools.js reset
`);
    process.exit(0);
  }
};

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command || command === 'help') {
  commands.help();
} else if (commands[command]) {
  commands[command](...args).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.log('Run "node scripts/dev-tools.js help" for usage information');
  process.exit(1);
}
