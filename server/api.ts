import { Router } from "express";
import { db } from "./db.ts";
import { NewsService } from "./services/newsService.ts";
import { ImageService } from "./services/imageService.ts";
import { encrypt, maskToken } from "./utils/crypto.ts";
import crypto from "node:crypto";
import multer from "multer";
import fs from "fs";

const router = Router();

// --- Multier Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "data/logos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `logo_${Date.now()}.${ext}`);
  }
});
const upload = multer({ storage });

// --- Credentials Management ---
router.get("/credentials", (req, res) => {
  const credentials = db.prepare("SELECT platform, api_key, api_secret, access_token, status FROM api_credentials").all() as any[];
  
  // Mask sensitive information before sending to client
  const maskedCredentials = credentials.map(c => ({
    ...c,
    api_key: c.api_key ? maskToken("EXISTS") : null,
    api_secret: c.api_secret ? maskToken("EXISTS") : null,
    access_token: c.access_token ? maskToken("EXISTS") : null,
    isSet: true
  }));
  
  res.json(maskedCredentials);
});

router.post("/credentials", (req, res) => {
  const { platform, api_key, api_secret, access_token } = req.body;
  
  try {
    // Encrypt keys before storing
    const encryptedKey = api_key ? encrypt(api_key) : null;
    const encryptedSecret = api_secret ? encrypt(api_secret) : null;
    const encryptedToken = access_token ? encrypt(access_token) : null;

    db.prepare(`
      INSERT OR REPLACE INTO api_credentials (platform, api_key, api_secret, access_token)
      VALUES (?, ?, ?, ?)
    `).run(platform, encryptedKey, encryptedSecret, encryptedToken);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Existing Data Routes ---
router.get("/topics", (req, res) => {
  const topics = db.prepare("SELECT * FROM topics ORDER BY collected_at DESC LIMIT 50").all();
  res.json(topics);
});

router.post("/topics/refresh", async (req, res) => {
  try {
    const news = await NewsService.getTrendingNews();
    for (const item of news) {
      db.prepare(`
        INSERT OR IGNORE INTO topics (id, title, link, source, published_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(item.id, item.title, item.link, item.source, item.published_at);
    }
    res.json({ success: true, count: news.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Posts API
router.get("/posts", (req, res) => {
  const posts = db.prepare("SELECT * FROM posts ORDER BY scheduled_at DESC").all();
  res.json(posts);
});

router.post("/posts/generate", async (req, res) => {
  const { topic_id, caption, hashtags } = req.body;
  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(topic_id) as any;

  if (!topic) return res.status(404).json({ error: "Topic not found" });

  try {
    const branding = db.prepare("SELECT logo_path, branding_theme FROM branding_settings WHERE id = 1").get() as any;
    
    // 1. Image generation
    const imageFilename = `post_${Date.now()}.png`;
    const imagePath = `data/generated/${imageFilename}`;
    await ImageService.createSocialImage(topic.title, imagePath, {
      logoPath: branding?.logo_path,
      theme: branding?.branding_theme
    });

    const postId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO posts (id, topic_id, content, hashtags, image_path, platform, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(postId, topic_id, caption, hashtags, `/generated/${imageFilename}`, "both", "draft");

    res.json({ success: true, postId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/posts/:id/schedule", (req, res) => {
  const { id } = req.params;
  const { scheduled_at } = req.body;
  db.prepare("UPDATE posts SET scheduled_at = ?, status = 'scheduled' WHERE id = ?").run(scheduled_at, id);
  res.json({ success: true });
});

router.patch("/posts/:id", (req, res) => {
  const { id } = req.params;
  const { content, hashtags } = req.body;
  
  try {
    db.prepare("UPDATE posts SET content = ?, hashtags = ? WHERE id = ? AND status = 'draft'")
      .run(content, hashtags, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- User Branding ---
router.get("/user/branding", (req, res) => {
  const branding = db.prepare("SELECT logo_path, branding_theme FROM branding_settings WHERE id = 1").get() as any;
  res.json(branding);
});

router.patch("/user/branding", (req, res) => {
  const { branding_theme } = req.body;
  try {
    db.prepare("UPDATE branding_settings SET branding_theme = ? WHERE id = 1").run(branding_theme);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/user/logo", upload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const logoPath = `/logos/${req.file.filename}`;
  try {
    db.prepare("UPDATE branding_settings SET logo_path = ? WHERE id = 1").run(logoPath);
    res.json({ success: true, logoPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    db.prepare("DELETE FROM analytics WHERE post_id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Analytics API
router.get("/analytics", (req, res) => {
  const stats = db.prepare(`
    SELECT p.id, p.content, a.likes, a.shares, a.reach, a.measured_at
    FROM posts p
    JOIN analytics a ON p.id = a.post_id
    ORDER BY a.measured_at DESC
  `).all();
  res.json(stats);
});

export default router;
