import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), "data.db");
export const db = new Database(dbPath);

export function initDatabase() {
  // Users for authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Secure storage for platform API credentials
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL, -- twitter, instagram, linkedin
      api_key TEXT,
      api_secret TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, platform)
    )
  `);

  // Topics/News items
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      link TEXT,
      source TEXT,
      published_at DATETIME,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' -- pending, processed, ignored
    )
  `);

  // Posts generated
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      content TEXT NOT NULL,
      hashtags TEXT,
      image_path TEXT,
      platform TEXT, -- twitter, instagram, both
      scheduled_at DATETIME,
      posted_at DATETIME,
      status TEXT DEFAULT 'draft', -- draft, scheduled, posted, failed
      FOREIGN KEY(topic_id) REFERENCES topics(id)
    )
  `);

  // Analytics (simple simulation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT,
      likes INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);
}
