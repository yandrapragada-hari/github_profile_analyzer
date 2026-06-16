const mysql = require('mysql2/promise');

let pool;
const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUrl) {
  const poolConfig = {
    uri: connectionUrl,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
  };

  if (
    process.env.DB_SSL === 'true' ||
    (!connectionUrl.includes('localhost') &&
      !connectionUrl.includes('127.0.0.1') &&
      process.env.NODE_ENV === 'production')
  ) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = mysql.createPool(poolConfig);
} else {
  const requiredEnv = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  const missing = requiredEnv.filter((k) => {
    const v = process.env[k];
    return v === undefined || v === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for MySQL connection. Please provide DATABASE_URL (or MYSQL_URL) or set the following individual env vars: ${missing.join(', ')}.`
    );
  }

  const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
  };

  if (
    process.env.DB_SSL === 'true' ||
    (process.env.NODE_ENV === 'production' &&
      poolConfig.host !== 'localhost' &&
      poolConfig.host !== '127.0.0.1' &&
      poolConfig.host !== '::1')
  ) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = mysql.createPool(poolConfig);
}

async function initializeDatabase() {
  console.log('Initializing database tables...');
  const createProfilesTable = `
    CREATE TABLE IF NOT EXISTS github_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE,
      name VARCHAR(255),
      bio TEXT,
      public_repos INT,
      followers INT,
      following_count INT,
      total_stars INT,
      most_used_language VARCHAR(100),
      top_repository VARCHAR(255),
      github_score INT,
      profile_url VARCHAR(255),
      avatar_url VARCHAR(255),
      account_created_at DATETIME,
      analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createHistoryTable = `
    CREATE TABLE IF NOT EXISTS profile_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100),
      followers INT,
      public_repos INT,
      total_stars INT,
      github_score INT,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (username)
    );
  `;
  try {
    await pool.execute(createProfilesTable);
    await pool.execute(createHistoryTable);
    console.log('Database initialization completed successfully. Tables are ready.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}

module.exports = { pool, initializeDatabase };



