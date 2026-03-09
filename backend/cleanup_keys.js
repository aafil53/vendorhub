require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'vendorhub',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function cleanDuplicateIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // Get all indexes on Users table
    const [results] = await sequelize.query(`SHOW INDEX FROM Users WHERE Column_name = 'email'`);
    
    // Filter to find duplicate ones that Sequelize generates (usually named email, email_2, email_3, etc.)
    const indexNames = results.map(r => r.Key_name);
    
    console.log(`Found ${indexNames.length} indexes on 'email' column.`);
    
    // Keep the primary email index (maybe named 'email' or 'users_email_uk')
    // Drop all others
    let dropCount = 0;
    for (let i = 0; i < indexNames.length; i++) {
        const idx = indexNames[i];
        if (idx !== 'PRIMARY' && idx !== 'email') { // Assuming 'email' is the base one we want to keep
            console.log(`Dropping index: ${idx}`);
            await sequelize.query(`ALTER TABLE Users DROP INDEX \`${idx}\``);
            dropCount++;
        }
    }
    
    console.log(`Successfully dropped ${dropCount} duplicate indexes.`);
  } catch (err) {
    console.error('Error cleaning indexes:', err);
  } finally {
    await sequelize.close();
  }
}

cleanDuplicateIndexes();
