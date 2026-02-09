const sequelize = require('./src/config/database');

async function inspect() {
  try {
    await sequelize.authenticate();
    console.log('--- Database Inspection ---');
    
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    
    if (results.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${results.length} tables:`);
      for (const table of results) {
        const tableName = table.name;
        const [[countResult]] = await sequelize.query(`SELECT count(*) as count FROM \`${tableName}\``);
        console.log(`- ${tableName}: ${countResult.count} records`);
      }
    }
    
    console.log('---------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error inspecting database:', error.message);
    process.exit(1);
  }
}

inspect();
