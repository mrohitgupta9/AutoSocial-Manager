import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, Calendar, CheckCircle, RefreshCcw, Send, BarChart3, Image as ImageIcon, History } from "lucide-react";
import { ApiService } from "./services/apiService";
import { GeminiService } from "./services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthMode, setIsAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [topics, setTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trends" | "posts" | "analytics" | "connections">("trends");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // 30s auto-refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [t, p, a, c] = await Promise.all([
        ApiService.getTopics(),
        ApiService.getPosts(),
        ApiService.getAnalytics(),
        ApiService.getCredentials()
      ]);
      setTopics(t);
      setPosts(p);
      setAnalytics(a);
      setCredentials(c);
    } catch (err) {
      console.error(err);
      if ((err as any).response?.status === 401 || (err as any).response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAuthMode === "register") {
        await ApiService.register(authForm);
        setIsAuthMode("login");
      } else {
        const result = await ApiService.login({ email: authForm.email, password: authForm.password });
        setUser(result.user);
      }
    } catch (err) {
      const msg = (err as any).response?.data?.error || "Authentication failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    setUser(null);
  };

  // ... (rest of the functions: handleRefreshTrends, handleGeneratePost)
  const handleRefreshTrends = async () => {
    setLoading(true);
    await ApiService.refreshTopics();
    await fetchData();
    setLoading(false);
  };

  const handleGeneratePost = async (topic: any) => {
    setLoading(true);
    try {
      const content = await GeminiService.generatePostContent(topic.title);
      await ApiService.generateImage(topic.id, content);
      await fetchData();
      setActiveTab("posts");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-3xl shadow-2xl shadow-black/5 w-full max-w-md border border-[#E4E6EB]"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#FF6321] rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-500/20">
              <Send size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1C1E21]">
              {isAuthMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-[#65676B] text-center mt-2">
              The automated social engine for creators.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isAuthMode === "register" && (
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full px-5 py-3.5 rounded-xl border border-[#E4E6EB] focus:ring-2 focus:ring-[#FF6321] outline-none transition-all"
                value={authForm.name}
                onChange={e => setAuthForm({...authForm, name: e.target.value})}
                required
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full px-5 py-3.5 rounded-xl border border-[#E4E6EB] focus:ring-2 focus:ring-[#FF6321] outline-none transition-all"
              value={authForm.email}
              onChange={e => setAuthForm({...authForm, email: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-5 py-3.5 rounded-xl border border-[#E4E6EB] focus:ring-2 focus:ring-[#FF6321] outline-none transition-all"
              value={authForm.password}
              onChange={e => setAuthForm({...authForm, password: e.target.value})}
              required
            />
            <button 
              disabled={loading}
              className="w-full bg-[#FF6321] hover:bg-[#FF4E00] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? "Processing..." : isAuthMode === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <p className="text-center mt-8 text-[#65676B] font-medium">
            {isAuthMode === "login" ? "New around here?" : "Already have an account?"} {" "}
            <button 
              onClick={() => setIsAuthMode(isAuthMode === "login" ? "register" : "login")}
              className="text-[#FF6321] hover:underline font-bold"
            >
              {isAuthMode === "login" ? "Join Now" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-[#E4E6EB] p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6321] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Send size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">AutoSocial</h1>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem 
            active={activeTab === "trends"} 
            onClick={() => setActiveTab("trends")} 
            icon={<TrendingUp size={20} />} 
            label="Trending Trends" 
          />
          <NavItem 
            active={activeTab === "posts"} 
            onClick={() => setActiveTab("posts")} 
            icon={<History size={20} />} 
            label="Content Archive" 
          />
          <NavItem 
            active={activeTab === "analytics"} 
            onClick={() => setActiveTab("analytics")} 
            icon={<BarChart3 size={20} />} 
            label="Performance" 
          />
          <NavItem 
            active={activeTab === "connections"} 
            onClick={() => setActiveTab("connections")} 
            icon={<Plus size={20} />} 
            label="API Connections" 
          />
        </div>

        <div className="mt-auto pt-6 border-t border-[#E4E6EB]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px]">{user.name?.[0] || user.email[0]}</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none">{user.name}</span>
              <button onClick={handleLogout} className="text-[10px] text-[#65676B] font-bold hover:text-[#FF6321] text-left">Sign Out</button>
            </div>
          </div>
          <div className="bg-[#FFF5F0] p-4 rounded-xl border border-[#FFE0D1]">
            <p className="text-[10px] font-bold text-[#FF6321] uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2 text-xs font-medium text-[#FF4E00]">
              <div className="w-2 h-2 rounded-full bg-[#FF4E00] animate-pulse" />
              AI Automation Active
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 p-10 max-w-6xl">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {activeTab === "trends" ? "Trending Now" : activeTab === "posts" ? "Managed Content" : activeTab === "analytics" ? "Performance Hub" : "API Connectivity"}
            </h2>
            <p className="text-[#65676B]">
              {activeTab === "trends" 
                ? "Discovered via global news feeds and social intelligence." 
                : activeTab === "posts" 
                ? "Your history of generated, scheduled, and published content."
                : activeTab === "analytics"
                ? "Real-time engagement metrics for your automated posts."
                : "Manage your social media platform integrations securely."}
            </p>
          </div>
          
          {activeTab === "trends" && (
            <button 
              onClick={handleRefreshTrends}
              disabled={loading}
              className="flex items-center gap-2 bg-white hover:bg-[#F0F2F5] text-[#1C1E21] px-5 py-2.5 rounded-full border border-[#E4E6EB] transition-all font-semibold shadow-sm disabled:opacity-50"
            >
              <RefreshCcw size={18} className={cn(loading && "animate-spin")} />
              Refresh Feeds
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "trends" && (
            <motion.div 
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4"
            >
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} onGenerate={() => handleGeneratePost(topic)} loading={loading} />
              ))}
              {topics.length === 0 && <EmptyState label="No fresh trends. Hit refresh to scan." />}
            </motion.div>
          )}

          {activeTab === "posts" && (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {posts.length === 0 && <EmptyState label="No content yet. Generate some posts from Trends!" />}
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-[#E4E6EB] overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-bottom border-[#E4E6EB]">
                    <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Content Preview</th>
                    <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Reach</th>
                    <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Engagement</th>
                    <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((stat, i) => (
                    <tr key={i} className="border-b border-[#F0F2F5] hover:bg-[#F8F9FA] transition-colors">
                      <td className="p-6">
                        <p className="font-medium text-sm line-clamp-1 max-w-xs">{stat.content}</p>
                      </td>
                      <td className="p-6 font-mono font-bold text-[#FF6321]">{stat.reach.toLocaleString()}</td>
                      <td className="p-6">
                        <div className="flex gap-4 text-sm font-medium">
                          <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> {stat.likes} likes</span>
                          <span className="flex items-center gap-1.5"><RefreshCcw size={14} className="text-blue-500" /> {stat.shares} shares</span>
                        </div>
                      </td>
                      <td className="p-6">
                         <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.length === 0 && <div className="p-20 text-center text-[#65676B]">Performance data will appear after your first post.</div>}
            </motion.div>
          )}

          {activeTab === "connections" && (
            <motion.div 
              key="connections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <ConnectionCard 
                platform="Twitter (X)" 
                connected={credentials.some(c => c.platform === "Twitter (X)")} 
                onSave={(data: any) => ApiService.saveCredentials({ platform: "Twitter (X)", ...data }).then(fetchData)}
              />
              <ConnectionCard 
                platform="Instagram" 
                connected={credentials.some(c => c.platform === "Instagram")} 
                onSave={(data: any) => ApiService.saveCredentials({ platform: "Instagram", ...data }).then(fetchData)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ConnectionCard({ platform, connected, onSave }: any) {
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState({ api_key: "", api_secret: "", access_token: "" });

  return (
    <div className="bg-white p-8 rounded-3xl border border-[#E4E6EB] hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F0F2F5] rounded-2xl flex items-center justify-center text-[#1C1E21] font-bold text-xl">
            {platform[0]}
          </div>
          <div>
            <h3 className="font-bold text-xl">{platform}</h3>
            <p className="text-xs font-semibold text-[#65676B]">
              Status: {connected ? <span className="text-green-500">Connected</span> : <span className="text-[#FF6321]">Not Linked</span>}
            </p>
          </div>
        </div>
      </div>

      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-xl border-2 border-dashed border-[#E4E6EB] text-[#65676B] font-bold hover:border-[#FF6321] hover:text-[#FF6321] transition-all"
        >
          {connected ? "Update Credentials" : "+ Link Platform"}
        </button>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <input 
            type="text" 
            placeholder="API Key" 
            className="w-full px-4 py-3 rounded-xl border border-[#E4E6EB] text-sm focus:ring-2 focus:ring-[#FF6321] outline-none"
            value={data.api_key}
            onChange={e => setData({...data, api_key: e.target.value})}
          />
          <input 
            type="text" 
            placeholder="API Secret" 
            className="w-full px-4 py-3 rounded-xl border border-[#E4E6EB] text-sm focus:ring-2 focus:ring-[#FF6321] outline-none"
            value={data.api_secret}
            onChange={e => setData({...data, api_secret: e.target.value})}
          />
          <input 
            type="text" 
            placeholder="Access Token" 
            className="w-full px-4 py-3 rounded-xl border border-[#E4E6EB] text-sm focus:ring-2 focus:ring-[#FF6321] outline-none"
            value={data.access_token}
            onChange={e => setData({...data, access_token: e.target.value})}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => { onSave(data); setShowForm(false); }}
              className="flex-grow bg-[#1C1E21] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all"
            >
              Verify & Save
            </button>
            <button 
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl border border-[#E4E6EB] font-bold text-sm hover:bg-[#F0F2F5] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all w-full text-left",
        active ? "bg-[#FFF5F0] text-[#FF6321]" : "text-[#65676B] hover:bg-[#F2F3F5] hover:text-[#1C1E21]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function TopicCard({ topic, onGenerate, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E4E6EB] hover:shadow-lg hover:shadow-black/5 transition-all flex items-center justify-between group">
      <div>
        <div className="flex items-center gap-2 mb-2">
           <span className="text-[10px] font-bold text-[#FF6321] uppercase tracking-widest bg-[#FFF5F0] px-2 py-0.5 rounded border border-[#FFE0D1]">
            {topic.source}
          </span>
          <span className="text-[10px] text-[#65676B] font-medium">
            {new Date(topic.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h3 className="font-bold text-lg leading-tight group-hover:text-[#FF6321] transition-colors max-w-xl">{topic.title}</h3>
      </div>
      
      <button 
        onClick={onGenerate}
        disabled={loading}
        className="bg-[#1C1E21] hover:bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
      >
        <Plus size={18} />
        Automate Post
      </button>
    </div>
  );
}

function PostCard({ post }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E6EB] overflow-hidden flex flex-col hover:shadow-xl transition-all">
      <div className="aspect-square bg-gray-100 relative overflow-hidden bg-gradient-to-br from-[#FF6321] to-[#FF4E00]">
        <img 
          src={post.image_path} 
          alt="Generated post" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex gap-2">
           <span className={cn(
             "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm",
             post.status === 'posted' ? "bg-green-500 text-white" : "bg-blue-500 text-white"
           )}>
            {post.status}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex gap-2 mb-4">
          <span className="text-[10px] font-medium text-[#65676B] uppercase tracking-widest px-2 py-0.5 rounded border border-[#E4E6EB]">Twitter</span>
           <span className="text-[10px] font-medium text-[#65676B] uppercase tracking-widest px-2 py-0.5 rounded border border-[#E4E6EB]">Instagram</span>
        </div>
        <p className="text-sm line-clamp-3 mb-4 leading-relaxed font-medium">
          {post.content}
        </p>
        <div className="text-[10px] font-bold text-[#FF6321] mb-6">
          {post.hashtags}
        </div>
        <div className="mt-auto pt-4 border-t border-[#F0F2F5] flex items-center justify-between text-[#8A8D91] text-xs font-semibold">
           <div className="flex items-center gap-1.5">
             <Calendar size={14} />
             {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : 'Scheduled'}
           </div>
           {post.status === 'draft' && (
             <button className="text-[#FF6321] hover:underline">Schedule</button>
           )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center border-2 border-dashed border-[#E4E6EB] rounded-3xl">
      <div className="w-16 h-16 bg-[#F0F2F5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8A8D91]">
        <ImageIcon size={32} />
      </div>
      <p className="text-[#65676B] font-medium">{label}</p>
    </div>
  );
}
