import { Router } from "express";
import { db } from "./db.ts";
import { NewsService } from "./services/newsService.ts";
import { ImageService } from "./services/imageService.ts";
import { authenticateToken, registerUser, loginUser, AuthRequest } from "./auth.ts";
import { encrypt, maskToken } from "./utils/crypto.ts";

const router = Router();

// --- Auth Routes ---
router.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const user = await registerUser(email, password, name);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Protected Routes Middleware ---
router.use(authenticateToken);

// --- Credentials Management ---
router.get("/credentials", (req: AuthRequest, res) => {
  const credentials = db.prepare("SELECT platform, api_key, api_secret, access_token, status FROM api_credentials WHERE user_id = ?").all(req.user?.id) as any[];
  
  // Mask sensitive information before sending to client
  const maskedCredentials = credentials.map(c => ({
    ...c,
    api_key: c.api_key ? maskToken("EXISTS") : null, // Just indicate existence
    api_secret: c.api_secret ? maskToken("EXISTS") : null,
    access_token: c.access_token ? maskToken("EXISTS") : null,
    isSet: true
  }));
  
  res.json(maskedCredentials);
});

router.post("/credentials", (req: AuthRequest, res) => {
  const { platform, api_key, api_secret, access_token } = req.body;
  const id = crypto.randomUUID();
  
  try {
    // Encrypt keys before storing
    const encryptedKey = api_key ? encrypt(api_key) : null;
    const encryptedSecret = api_secret ? encrypt(api_secret) : null;
    const encryptedToken = access_token ? encrypt(access_token) : null;

    db.prepare(`
      INSERT OR REPLACE INTO api_credentials (id, user_id, platform, api_key, api_secret, access_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.user?.id, platform, encryptedKey, encryptedSecret, encryptedToken);
    
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
    // 1. Image generation (Backend handles this as it uses sharp)
    const imageFilename = `post_${Date.now()}.png`;
    const imagePath = `data/generated/${imageFilename}`;
    await ImageService.createSocialImage(topic.title, imagePath);

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
