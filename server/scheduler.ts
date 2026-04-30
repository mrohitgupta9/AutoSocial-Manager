import cron from "node-cron";
import { db } from "./db.ts";

export function startScheduler() {
  // Check for scheduled posts every minute
  cron.schedule("* * * * *", () => {
    const now = new Date().toISOString();
    const pendingPosts = db.prepare(`
      SELECT * FROM posts 
      WHERE status = 'scheduled' AND scheduled_at <= ?
    `).all(now) as any[];

    for (const post of pendingPosts) {
      console.log(`[Scheduler] Posting content: ${post.id} to ${post.platform}`);
      
      // Simulation of actual API posting
      try {
        // Here you would call Instagram/Twitter APIs
        // For now, we simulate success
        db.prepare("UPDATE posts SET status = 'posted', posted_at = ? WHERE id = ?")
          .run(new Date().toISOString(), post.id);
          
        // Generate simulated initial analytics
        db.prepare("INSERT INTO analytics (post_id, likes, shares, reach) VALUES (?, ?, ?, ?)")
          .run(post.id, Math.floor(Math.random() * 10), Math.floor(Math.random() * 5), Math.floor(Math.random() * 100));
          
        console.log(`[Scheduler] Successfully "posted" ${post.id}`);
      } catch (error) {
        console.error(`[Scheduler] Failed to post ${post.id}:`, error);
        db.prepare("UPDATE posts SET status = 'failed' WHERE id = ?").run(post.id);
      }
    }
  });

  // Auto-refresh topics every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Auto-refreshing topics...");
    // This could call the refresh logic
  });
}
