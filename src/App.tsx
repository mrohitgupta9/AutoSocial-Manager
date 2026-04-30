import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, Calendar, CheckCircle, RefreshCcw, Send, BarChart3, Image as ImageIcon, History, Trash2 } from "lucide-react";
import { ApiService } from "./services/apiService";
import { GeminiService } from "./services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [topics, setTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [branding, setBranding] = useState<any>({ logo_path: null, branding_theme: "modern" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trends" | "posts" | "analytics" | "connections" | "branding">("trends");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [t, p, a, c, b] = await Promise.all([
        ApiService.getTopics(),
        ApiService.getPosts(),
        ApiService.getAnalytics(),
        ApiService.getCredentials(),
        ApiService.getBranding()
      ]);
      setTopics(t);
      setPosts(p);
      setAnalytics(a);
      setCredentials(c);
      setBranding(b);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshTrends = async () => {
    setLoading(true);
    try {
      await ApiService.refreshTopics();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePost = async (topic: any) => {
    setLoading(true);
    try {
      const content = await GeminiService.generatePostContent(topic.title);
      await ApiService.generatePost(topic.id, content.caption, content.hashtags.join(" "));
      await fetchData();
      setActiveTab("posts");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            active={activeTab === "branding"} 
            onClick={() => setActiveTab("branding")} 
            icon={<ImageIcon size={20} />} 
            label="Branding" 
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
              {activeTab === "trends" ? "Trending Now" : activeTab === "posts" ? "Managed Content" : activeTab === "analytics" ? "Performance Hub" : activeTab === "branding" ? "Brand Identity" : "API Connectivity"}
            </h2>
            <p className="text-[#65676B]">
              {activeTab === "trends" 
                ? "Discovered via global news feeds and social intelligence." 
                : activeTab === "posts" 
                ? "Your history of generated, scheduled, and published content."
                : activeTab === "branding"
                ? "Customize your logo and visual style for AI-generated posts."
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
                <PostCard key={post.id} post={post} onRefresh={fetchData} />
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
              className="space-y-8"
            >
              {analytics.length > 0 && (
                <div className="bg-white p-8 rounded-3xl border border-[#E4E6EB] shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#FF6321]" />
                    Engagement Metrics Overview
                  </h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
                        <XAxis 
                          dataKey="content" 
                          angle={-15} 
                          textAnchor="end" 
                          interval={0} 
                          height={70} 
                          tick={{ fontSize: 10, fill: '#65676B', fontWeight: 600 }}
                          tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#65676B' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar 
                          name="Reach" 
                          dataKey="reach" 
                          fill="#FF6321" 
                          radius={[6, 6, 0, 0]} 
                          barSize={40} 
                        />
                        <Bar 
                          name="Likes" 
                          dataKey="likes" 
                          fill="#6228d7" 
                          radius={[6, 6, 0, 0]} 
                          barSize={40} 
                        />
                        <Bar 
                          name="Shares" 
                          dataKey="shares" 
                          fill="#ee2a7b" 
                          radius={[6, 6, 0, 0]} 
                          barSize={40} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-[#E4E6EB] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#F0F2F5] flex justify-between items-center">
                   <h3 className="font-bold text-lg">Detailed Analytics</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8D91]">Real-time Tracking</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EB]">
                        <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Content Preview</th>
                        <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Reach</th>
                        <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Engagement</th>
                        <th className="p-6 text-[10px] font-bold text-[#65676B] uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((stat, i) => (
                        <tr key={i} className="border-b border-[#F0F2F5] hover:bg-[#F8F9FA] transition-colors group">
                          <td className="p-6">
                            <p className="font-bold text-sm line-clamp-1 max-w-xs group-hover:text-[#FF6321] transition-colors">{stat.content}</p>
                          </td>
                          <td className="p-6 font-mono font-black text-[#FF6321]">{stat.reach.toLocaleString()}</td>
                          <td className="p-6">
                            <div className="flex gap-4 text-xs font-bold font-mono">
                              <span className="flex items-center gap-1.5 text-[#6228d7] bg-[#6228d7]/10 px-2 py-1 rounded-lg">
                                <CheckCircle size={14} /> {stat.likes}
                              </span>
                              <span className="flex items-center gap-1.5 text-[#ee2a7b] bg-[#ee2a7b]/10 px-2 py-1 rounded-lg">
                                <RefreshCcw size={14} /> {stat.shares}
                              </span>
                            </div>
                          </td>
                          <td className="p-6">
                             <span className="bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-green-500/20">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analytics.length === 0 && (
                  <div className="p-32 text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 text-[#E4E6EB]" />
                    <p className="text-[#65676B] font-bold">Performance data will appear after your first post is active.</p>
                  </div>
                )}
              </div>
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

          {activeTab === "branding" && (
            <motion.div 
              key="branding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BrandingView branding={branding} onRefresh={fetchData} />
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

function PostCard({ post, onRefresh }: any) {
  const [showPicker, setShowPicker] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedHashtags, setEditedHashtags] = useState(post.hashtags);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await ApiService.deletePost(post.id);
      onRefresh();
    } catch (err) {
      console.error("Deletion failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleTime) return;
    setIsScheduling(true);
    try {
      const isoString = new Date(scheduleTime).toISOString();
      await ApiService.schedulePost(post.id, isoString);
      onRefresh();
    } catch (err) {
      console.error("Scheduling failed", err);
    } finally {
      setIsScheduling(false);
      setShowPicker(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await ApiService.updatePost(post.id, { content: editedContent, hashtags: editedHashtags });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="bg-white rounded-2xl border border-[#E4E6EB] overflow-hidden flex flex-col hover:shadow-xl transition-all h-full">
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
             post.status === 'posted' ? "bg-green-500 text-white" : 
             post.status === 'scheduled' ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
           )}>
            {post.status}
          </span>
          {(!isEditing) && (
            <div className="flex gap-1">
              {post.status === 'draft' && (
                <button 
                  onClick={() => setIsPreviewOpen(true)}
                  className="bg-white/90 hover:bg-white text-[#1C1E21] p-1.5 rounded-lg shadow-sm transition-colors"
                  title="Preview Post"
                >
                  <Send size={14} />
                </button>
              )}
              {post.status === 'draft' && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/90 hover:bg-white text-[#1C1E21] p-1.5 rounded-lg shadow-sm transition-colors"
                  title="Edit Post"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              )}
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-white/90 hover:bg-red-50 text-[#1C1E21] hover:text-red-600 p-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                title="Delete Post"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex gap-2 mb-4">
          <span className="text-[10px] font-medium text-[#65676B] uppercase tracking-widest px-2 py-0.5 rounded border border-[#E4E6EB]">Twitter</span>
           <span className="text-[10px] font-medium text-[#65676B] uppercase tracking-widest px-2 py-0.5 rounded border border-[#E4E6EB]">Instagram</span>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3 mb-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative group">
              <textarea
                autoFocus
                className={cn(
                  "w-full px-4 py-3 rounded-xl border-2 text-sm focus:ring-4 outline-none min-h-[120px] resize-none shadow-sm transition-all",
                  [editedContent, editedHashtags].filter(Boolean).join("\n").length > 280 ? "border-red-500 focus:ring-red-500/10 shadow-red-500/5 shadow-inner" : "border-[#FF6321] focus:ring-[#FF6321]/10"
                )}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Write your caption here..."
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black px-2 py-1 rounded",
                  [editedContent, editedHashtags].filter(Boolean).join("\n").length > 280 ? "bg-red-500 text-white" : "bg-white/80 text-[#8A8D91]"
                )}>
                  {[editedContent, editedHashtags].filter(Boolean).join("\n").length} / 280
                </span>
                <div className="text-[10px] font-bold text-[#8A8D91] bg-white/80 px-2 py-1 rounded">
                  Caption
                </div>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E4E6EB] focus:border-[#FF6321] text-xs font-bold text-[#FF6321] focus:ring-4 focus:ring-[#FF6321]/10 outline-none transition-all"
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
                placeholder="#hashtags"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8A8D91]">
                Hashtags
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-grow bg-[#FF6321] hover:bg-[#FF4E00] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-[#FF6321]/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button 
                onClick={() => { setIsEditing(false); setEditedContent(post.content); setEditedHashtags(post.hashtags); }}
                className="px-6 py-3 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => post.status === 'draft' && setIsEditing(true)}
            className={cn(
              "group cursor-pointer relative",
              post.status === 'draft' && "hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
            )}
          >
            <p className="text-sm line-clamp-3 mb-4 leading-relaxed font-medium">
              {post.content}
            </p>
            <div className="text-[10px] font-bold text-[#FF6321] mb-6">
              {post.hashtags}
            </div>
            {post.status === 'draft' && (
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FF6321] text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-xl">
                Click to Edit
              </div>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-[#F0F2F5]">
           {post.status === 'draft' ? (
             <div className="space-y-3">
               {!showPicker ? (
                 <button 
                  onClick={() => setShowPicker(true)}
                  className="w-full text-[#FF6321] hover:bg-[#FFF5F0] py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#FFE0D1]"
                 >
                   <Calendar size={14} /> Schedule Post
                 </button>
               ) : (
                 <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                   <input 
                     type="datetime-local" 
                     className="w-full px-3 py-2 rounded-lg border border-[#E4E6EB] text-xs font-semibold focus:ring-2 focus:ring-[#FF6321] outline-none"
                     value={scheduleTime}
                     onChange={(e) => setScheduleTime(e.target.value)}
                   />
                   <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={handleSchedule}
                       disabled={!scheduleTime || isScheduling}
                       className="bg-[#FF6321] text-white py-2 rounded-lg font-bold text-xs disabled:opacity-50"
                     >
                       {isScheduling ? "..." : "Confirm"}
                     </button>
                     <button 
                       onClick={() => setShowPicker(false)}
                       className="bg-[#F0F2F5] text-[#65676B] py-2 rounded-lg font-bold text-xs"
                     >
                       Cancel
                     </button>
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex items-center justify-between text-[#8A8D91] text-xs font-semibold">
               <div className="flex items-center gap-1.5">
                 <Calendar size={14} />
                 {post.posted_at 
                    ? new Date(post.posted_at).toLocaleDateString() + ' ' + new Date(post.posted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    : post.scheduled_at 
                      ? 'Set for ' + new Date(post.scheduled_at).toLocaleDateString()
                      : 'Not set'}
               </div>
               {post.status === 'posted' && <CheckCircle size={14} className="text-green-500" />}
             </div>
           )}
        </div>
      </div>
    </div>

    <AnimatePresence>
      {isPreviewOpen && (
        <SocialPreviewModal 
          post={post} 
          editedContent={editedContent} 
          editedHashtags={editedHashtags} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </AnimatePresence>
    </>
  );
}

function BrandingView({ branding, onRefresh }: any) {
  const [loading, setLoading] = useState(false);
  const themes = [
    { id: 'modern', name: 'Modern Gradient', desc: 'Vibrant orange and red energy.', colors: 'bg-gradient-to-br from-[#FF6B35] to-[#D00000]' },
    { id: 'bold', name: 'Bold Pulse', desc: 'High-contrast royal purple and pink.', colors: 'bg-gradient-to-br from-[#6228d7] to-[#ee2a7b]' },
    { id: 'minimal', name: 'Clean Minimal', desc: 'Sophisticated light gray and dark ink.', colors: 'bg-[#F8F9FA] border border-[#E4E6EB]' },
    { id: 'brutalist', name: 'Brutalist Yellow', desc: 'Raw, energetic black on yellow.', colors: 'bg-[#FFE000]' },
  ];

  const handleThemeChange = async (themeId: string) => {
    setLoading(true);
    try {
      await ApiService.updateBranding({ branding_theme: themeId });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await ApiService.uploadLogo(file);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[32px] border border-[#E4E6EB]">
          <h3 className="text-xl font-bold mb-6">Logo Configuration</h3>
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-[#F8F9FA] rounded-[24px] border-2 border-dashed border-[#E4E6EB] flex items-center justify-center overflow-hidden relative group">
              {branding.logo_path ? (
                <img src={branding.logo_path} alt="Logo" className="w-full h-full object-contain p-4" />
              ) : (
                <ImageIcon size={32} className="text-[#8A8D91]" />
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                <span className="text-white text-xs font-bold px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-md">Change</span>
              </label>
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-sm mb-2">Upload your Brand Logo</h4>
              <p className="text-xs text-[#65676B] leading-relaxed mb-4">
                Recommended: Transparent PNG, at least 400x400px. This logo will be overlaid on all your generated content.
              </p>
              <label className="inline-flex px-6 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-full text-xs font-black cursor-pointer transition-colors">
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                Select File
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[32px] border border-[#E4E6EB]">
          <h3 className="text-xl font-bold mb-6">Visual Themes</h3>
          <div className="grid grid-cols-1 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  branding.branding_theme === t.id ? "border-[#FF6321] bg-[#FFF5F0]" : "border-[#E4E6EB] hover:border-[#8A8D91]"
                )}
              >
                <div className={cn("w-16 h-16 rounded-xl flex-shrink-0 shadow-sm", t.colors)} />
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    {t.name}
                    {branding.branding_theme === t.id && <CheckCircle size={14} className="text-[#FF6321]" />}
                  </h4>
                  <p className="text-xs text-[#65676B]">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-10 h-fit">
        <section className="bg-black text-white p-8 rounded-[32px] flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Live Brand Mockup</h3>
            <p className="text-[#8A8D91] text-xs font-medium">How your content will look with current settings.</p>
          </div>
          
          <div className={cn(
            "aspect-square rounded-[24px] w-full relative overflow-hidden flex flex-col items-center justify-center p-12 text-center",
            branding.branding_theme === 'modern' ? "bg-gradient-to-br from-[#FF6B35] to-[#D00000] text-white" :
            branding.branding_theme === 'bold' ? "bg-gradient-to-br from-[#6228d7] to-[#ee2a7b] text-white" :
            branding.branding_theme === 'minimal' ? "bg-white text-black border border-[#E4E6EB]" :
            "bg-[#FFE000] text-black"
          )}>
            {branding.logo_path && (
              <img src={branding.logo_path} className="w-16 h-16 object-contain absolute top-8" alt="Branding" />
            )}
            <h4 className="text-3xl font-black uppercase leading-tight tracking-tight">
              Sample Heading<br/>for your<br/>Brand
            </h4>
            <div className="absolute bottom-8 font-black text-[10px] tracking-widest opacity-60 uppercase">
              AutoSocial | Brand Sample
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-[#8A8D91] uppercase font-bold tracking-widest mb-2 text-center">Theme Intelligence</p>
            <p className="text-xs italic text-center text-white/80">
              "Your brand identity is automatically baked into every generated post using high-performance image processing."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SocialPreviewModal({ post, editedContent, editedHashtags, onClose }: any) {
  const [platform, setPlatform] = useState<"twitter" | "instagram">("twitter");
  
  const fullText = [editedContent, editedHashtags].filter(Boolean).join("\n");
  const twitterCharCount = fullText.length;
  const twitterLimit = 280;
  const isTwitterOverLimit = twitterCharCount > twitterLimit;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={cn(
          "bg-white rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-500",
          isTwitterOverLimit && platform === "twitter" ? "ring-8 ring-red-500/20" : ""
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Preview Controls & Info */}
        <div className="w-full md:w-80 bg-[#F8F9FA] border-r border-[#E4E6EB] p-8 flex flex-col">
          <h3 className="font-bold text-xl mb-6">Platform Preview</h3>
          
          <div className="flex flex-col gap-2 mb-8">
            <button 
              onClick={() => setPlatform("twitter")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left",
                platform === "twitter" ? "bg-black text-white" : "hover:bg-[#E4E6EB] text-[#65676B]"
              )}
            >
              Twitter (X)
            </button>
            <button 
              onClick={() => setPlatform("instagram")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left",
                platform === "instagram" ? "bg-[#E1306C] text-white" : "hover:bg-[#E4E6EB] text-[#65676B]"
              )}
            >
              Instagram
            </button>
          </div>

          <div className="mt-auto space-y-6">
            {platform === "twitter" ? (
              <div className={cn(
                "p-5 bg-white rounded-2xl border-2 transition-all shadow-sm",
                isTwitterOverLimit ? "border-red-500 bg-red-50" : "border-[#E4E6EB]"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isTwitterOverLimit ? "text-red-600" : "text-[#65676B]"
                  )}>Character Limit</p>
                  {isTwitterOverLimit && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-red-500" 
                    />
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <span className={cn("text-3xl font-black", isTwitterOverLimit ? "text-red-600" : "text-black")}>
                    {twitterCharCount}
                  </span>
                  <span className="text-sm font-bold text-[#8A8D91]">/ {twitterLimit}</span>
                </div>
                <div className="w-full bg-[#F0F2F5] h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", isTwitterOverLimit ? "bg-red-500" : "bg-[#1D9BF0]")} 
                    style={{ width: `${Math.min((twitterCharCount / twitterLimit) * 100, 100)}%` }}
                  />
                </div>
                {isTwitterOverLimit && (
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-tight flex items-center gap-1">
                      ⚠️ Limit Exceeded
                    </p>
                    <p className="text-[9px] text-red-500 font-medium">Please shorten your post for Twitter (X).</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-[#E4E6EB]">
                <p className="text-[10px] font-bold text-[#65676B] uppercase tracking-widest mb-2">Visual Specs</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Aspect Ratio</span>
                    <span className="text-xs font-black text-[#E1306C]">1:1 Square</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F0F2F5] pt-2">
                    <span className="text-xs font-bold">Safe Zone</span>
                    <span className="text-xs font-black text-green-500">Optimal</span>
                  </div>
                  <p className="text-[10px] text-[#8A8D91] leading-relaxed italic">
                    Instagram prefers high-contrast square images (1080x1080) for the best grid alignment.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="w-full py-4 bg-[#1C1E21] text-white rounded-xl font-bold hover:bg-black transition-all active:scale-95"
            >
              Done Previewing
            </button>
          </div>
        </div>

        {/* Right Side: Visual Mockup */}
        <div className="flex-grow p-12 bg-[#F0F2F5] flex items-center justify-center min-h-[500px]">
          {platform === "twitter" ? (
            <div className="bg-white border border-[#EFF3F4] rounded-2xl w-full max-w-[500px] p-4 flex gap-3 shadow-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs text-[#FF6321]">
                AS
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-[15px]">AutoSocial AI</span>
                  <span className="text-[#536471] text-[15px]">@autosocial · 1m</span>
                </div>
                <p className="text-[15px] leading-normal whitespace-pre-wrap mb-3">
                  {editedContent}
                  <br />
                  <span className="text-[#1D9BF0]">{editedHashtags}</span>
                </p>
                <div className="rounded-2xl border border-[#EFF3F4] overflow-hidden mb-3">
                  <img src={post.image_path} alt="Post" className="w-full object-cover aspect-video" referrerPolicy="no-referrer" />
                </div>
                <div className="flex justify-between text-[#536471] px-4 max-w-sm">
                  <Plus size={18} className="hover:text-[#1D9BF0] cursor-pointer transition-colors" />
                  <RefreshCcw size={18} className="hover:text-green-500 cursor-pointer transition-colors" />
                  <CheckCircle size={18} className="hover:text-red-500 cursor-pointer transition-colors" />
                  <Send size={18} className="hover:text-[#1D9BF0] cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#DBDBDB] rounded-lg w-full max-w-[400px] overflow-hidden shadow-xl">
              <div className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
                  <div className="w-full h-full bg-white rounded-full p-[1px]">
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px] text-[#FF6321]">
                       AS
                    </div>
                  </div>
                </div>
                <span className="font-bold text-xs">autosocial_ai</span>
              </div>
              <img src={post.image_path} alt="Post" className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
              <div className="p-4">
                <div className="flex gap-4 mb-3">
                  <Plus size={24} className="hover:opacity-60 cursor-pointer transition-opacity" />
                  <RefreshCcw size={24} className="hover:opacity-60 cursor-pointer transition-opacity" />
                  <Send size={24} className="hover:opacity-60 cursor-pointer transition-opacity" />
                </div>
                <p className="text-sm font-bold mb-1">0 likes</p>
                <p className="text-sm">
                  <span className="font-bold mr-2">autosocial_ai</span>
                  {editedContent}
                </p>
                <p className="text-[#00376B] text-sm">{editedHashtags}</p>
                <p className="text-[#8E8E8E] text-[10px] uppercase mt-2 font-medium">Just Now</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
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
