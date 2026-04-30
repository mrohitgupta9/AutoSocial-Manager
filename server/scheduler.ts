import cron from "node-cron";
import { db } from "./db.ts";
import { PostingService } from "./services/postingService.ts";

export function startScheduler() {
  // Check for scheduled posts every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date().toISOString();
    const pendingPosts = db.prepare(`
      SELECT * FROM posts 
      WHERE status = 'scheduled' AND scheduled_at <= ?
    `).all(now) as any[];

    for (const post of pendingPosts) {
      try {
        await PostingService.postContent(post.id);
        console.log(`[Scheduler] Successfully automated ${post.id}`);
      } catch (error) {
        console.error(`[Scheduler] Failed to automate ${post.id}:`, error);
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
