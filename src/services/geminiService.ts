import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private static ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  static async generatePostContent(topicTitle: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate an engaging social media post caption and hashtags for the following news topic: "${topicTitle}". 
        The tone should be energetic, professional, and viral-ready.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING, description: "The main caption for the post" },
              hashtags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 3-5 relevant hashtags"
              }
            },
            required: ["caption", "hashtags"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return {
        caption: data.caption || "Check this out!",
        hashtags: data.hashtags || ["#trending", "#news"]
      };
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      return {
        caption: `Interesting update on ${topicTitle}. Read more!`,
        hashtags: ["#news", "#update"]
      };
    }
  }
}
