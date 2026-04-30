import axios from "axios";

export class ApiService {
  static async getTopics() {
    return (await axios.get("/api/topics")).data;
  }

  static async refreshTopics() {
    return (await axios.post("/api/topics/refresh", {})).data;
  }

  static async getPosts() {
    return (await axios.get("/api/posts")).data;
  }

  static async generatePost(topicId: string, caption: string, hashtags: string) {
    return (await axios.post("/api/posts/generate", { 
      topic_id: topicId,
      caption: caption,
      hashtags: hashtags
    })).data;
  }

  static async schedulePost(postId: string, scheduledAt: string) {
    return (await axios.post(`/api/posts/${postId}/schedule`, { scheduled_at: scheduledAt })).data;
  }

  static async updatePost(postId: string, data: { content: string, hashtags: string }) {
    return (await axios.patch(`/api/posts/${postId}`, data)).data;
  }

  static async deletePost(postId: string) {
    return (await axios.delete(`/api/posts/${postId}`)).data;
  }
  
  static async getBranding() {
    return (await axios.get("/api/user/branding")).data;
  }
  
  static async updateBranding(data: { branding_theme: string }) {
    return (await axios.patch("/api/user/branding", data)).data;
  }
  
  static async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append("logo", file);
    return (await axios.post("/api/user/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })).data;
  }

  static async getAnalytics() {
    return (await axios.get("/api/analytics")).data;
  }

  static async getCredentials() {
    return (await axios.get("/api/credentials")).data;
  }

  static async saveCredentials(data: any) {
    return (await axios.post("/api/credentials", data)).data;
  }
}
