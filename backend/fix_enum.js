const sequelize = require('./src/config/database');
sequelize.query("ALTER TABLE Bids MODIFY COLUMN status ENUM('pending','draft','submitted','revised','accepted','rejected','withdrawn','declined','expired') NOT NULL DEFAULT 'draft'")
.then(() => { console.log('SUCCESS: ENUM updated'); process.exit(); })
.catch(err => { console.error('ERROR:', err.message); process.exit(); });
