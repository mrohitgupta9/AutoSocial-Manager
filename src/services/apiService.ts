import axios from "axios";

// Helper to get token from storage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class ApiService {
  static async register(data: any) {
    return (await axios.post("/api/auth/register", data)).data;
  }

  static async login(data: any) {
    const res = await axios.post("/api/auth/login", data);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  }

  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  static async getTopics() {
    return (await axios.get("/api/topics", { headers: getAuthHeaders() })).data;
  }

  static async refreshTopics() {
    return (await axios.post("/api/topics/refresh", {}, { headers: getAuthHeaders() })).data;
  }

  static async getPosts() {
    return (await axios.get("/api/posts", { headers: getAuthHeaders() })).data;
  }

  static async generateImage(topicId: string, content: any) {
    return (await axios.post("/api/posts/generate", { 
      topic_id: topicId,
      content: content.caption,
      hashtags: content.hashtags.join(" ")
    }, { headers: getAuthHeaders() })).data;
  }

  static async schedulePost(postId: string, scheduledAt: string) {
    return (await axios.post(`/api/posts/${postId}/schedule`, { scheduled_at: scheduledAt }, { headers: getAuthHeaders() })).data;
  }

  static async getAnalytics() {
    return (await axios.get("/api/analytics", { headers: getAuthHeaders() })).data;
  }

  static async getCredentials() {
    return (await axios.get("/api/credentials", { headers: getAuthHeaders() })).data;
  }

  static async saveCredentials(data: any) {
    return (await axios.post("/api/credentials", data, { headers: getAuthHeaders() })).data;
  }
}
// We also need a ContentService on the backend that handles the image generation call
// Actually, I already put that logic in /api/posts/generate
