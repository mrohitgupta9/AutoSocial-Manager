import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), "data.db");
export const db = new Database(dbPath);

export function initDatabase() {
  // Global branding settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS branding_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      logo_path TEXT,
      branding_theme TEXT DEFAULT 'modern'
    )
  `);

  // Initialize default branding if not exists
  const existingBranding = db.prepare("SELECT * FROM branding_settings WHERE id = 1").get();
  if (!existingBranding) {
    db.prepare("INSERT INTO branding_settings (id, branding_theme) VALUES (1, 'modern')").run();
  }

  // Migration: Drop old tables if they have the old schema (containing user_id)
  const postsInfo = db.prepare("PRAGMA table_info(posts)").all() as any[];
  if (postsInfo.some(col => col.name === 'user_id')) {
    console.log("Migrating database: Dropping old tables to match new auth-less schema");
    db.exec("DROP TABLE IF EXISTS analytics");
    db.exec("DROP TABLE IF EXISTS posts");
    db.exec("DROP TABLE IF EXISTS api_credentials");
    db.exec("DROP TABLE IF EXISTS users");
  }

  // Secure storage for platform API credentials
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_credentials (
      platform TEXT PRIMARY KEY, -- twitter, instagram, linkedin
      api_key TEXT,
      api_secret TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at DATETIME,
      status TEXT DEFAULT 'active'
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
