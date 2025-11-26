
require('dotenv').config({ path: './src/.env' });
const mariadb = require('mariadb');
let config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  acquireTimeout: 10000,
  connectTimeout: 10000
}

console.log(config)
const pool = mariadb.createPool(config);

module.exports = pool;