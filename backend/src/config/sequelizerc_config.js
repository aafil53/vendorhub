require('dotenv').config();

const config = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'rootpassword',
  database: process.env.DB_NAME || 'vendorhub',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
};

if (process.env.DB_DIALECT === 'sqlite') {
  config.storage = process.env.DB_STORAGE || './vendorhub.sqlite';
}

module.exports = {
  development: config,
  test: config,
  production: config,
};
