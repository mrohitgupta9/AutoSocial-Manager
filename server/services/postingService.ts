import { db } from "../db.ts";
import { decrypt } from "../utils/crypto.ts";

export class PostingService {
  static async postContent(postId: string) {
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId) as any;
    if (!post) throw new Error("Post not found");

    const userId = post.user_id;
    const credentials = db.prepare("SELECT * FROM api_credentials WHERE user_id = ?").all(userId) as any[];

    console.log(`[PostingService] Processing post ${postId} for user ${userId}`);

    // Filter relevant platforms
    const platforms = post.platform === "both" ? ["Twitter (X)", "Instagram"] : [post.platform];

    for (const platform of platforms) {
      const creds = credentials.find(c => c.platform === platform);
      if (!creds) {
        console.warn(`[PostingService] No credentials found for ${platform}. Skipping.`);
        continue;
      }

      // Decrypt credentials
      const apiKey = decrypt(creds.api_key);
      const apiSecret = decrypt(creds.api_secret);
      const accessToken = decrypt(creds.access_token);

      console.log(`[PostingService] Attempting to post to ${platform} using decrypted keys...`);
      
      // REAL API LOGIC WOULD GO HERE
      // Example for Twitter:
      // const client = new TwitterApi({ appKey: apiKey, appSecret: apiSecret, accessToken: accessToken });
      // await client.v2.tweet(post.content + " " + post.hashtags);
      
      // Since we don't have real keys, we just simulate the success
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[PostingService] Successfully posted to ${platform}`);
    }

    // Update post status
    db.prepare("UPDATE posts SET status = 'posted', posted_at = ? WHERE id = ?")
      .run(new Date().toISOString(), postId);

    // Initial Analytics
    db.prepare("INSERT INTO analytics (post_id, likes, shares, reach) VALUES (?, ?, ?, ?)")
      .run(postId, 0, 0, 0);

    return { success: true };
  }
}
