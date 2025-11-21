-- Initialize users table for JWT authentication
-- Run this script against your MariaDB database

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Optional: Insert a default admin user (password: admin123)
-- Hash generated using bcrypt with salt rounds 10
-- You can generate your own hash using: https://bcrypt-generator.com/
-- Or use the register endpoint to create users
-- INSERT INTO users (username, password_hash) VALUES ('admin', '$2a$10$example.hash.here');