import React, { useState, useEffect } from "react";
import { BlogPost, User } from "./types";
import { api } from "./api";
import { 
  BookOpen, 
  Search, 
  PenTool, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  ChevronRight, 
  FileText, 
  Trash2, 
  Edit3, 
  Grid, 
  MessageSquare,
  Clock,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import AuthModal from "./components/AuthModal";
import BlogCard from "./components/BlogCard";
import BlogForm from "./components/BlogForm";
import CommentsList from "./components/CommentsList";
import { motion, AnimatePresence } from "motion/react";

// Inline helper for high quality paragraph & bullet rendering of Essays
function EssayMarkdownRenderer({ content }: { content: string }) {
  const blocks = content.split("\n\n");
  return (
    <div className="space-y-6 font-serif text-gray-300 leading-relaxed text-base md:text-[17px]">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code blocks
        if (trimmed.startsWith("```")) {
          const lines = trimmed.split("\n");
          const codeLines = lines.slice(1, lines.length - 1);
          return (
            <pre key={idx} className="bg-[#15151a] border border-[#1f1f23] rounded-lg p-4 md:p-5 overflow-x-auto font-mono text-xs md:text-sm text-amber-100/90 my-6 shadow-2xl leading-relaxed">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
        }

        // Subheadings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-sans font-semibold text-lg md:text-xl text-amber-100/95 pt-5 pb-1 tracking-tight">
              {trimmed.substring(4)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-sans font-normal text-xl md:text-2xl text-white pt-7 pb-2 tracking-tight">
              {trimmed.substring(3)}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="font-serif font-light text-2xl md:text-3xl text-white pt-9 pb-3 tracking-tight">
              {trimmed.substring(2)}
            </h2>
          );
        }

        // Bullet lists
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.includes("\n* ") || trimmed.includes("\n- ")) {
          const lines = trimmed.split("\n").filter(l => l.trim().length > 0);
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2.5 font-sans text-sm md:text-base text-gray-400 my-4">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\*\-]\s+/, "");
                return <li key={lIdx} className="font-light leading-relaxed">{cleanLine}</li>;
              })}
            </ul>
          );
        }

        // Numbered lists
        if (trimmed.match(/^\d+\.\s/) || trimmed.includes("\n1. ")) {
          const lines = trimmed.split("\n").filter(l => l.trim().length > 0);
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2.5 font-sans text-sm md:text-base text-gray-400 my-4 border-l border-[#1f1f23] flex flex-col">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*\d+\.\s+/, "");
                return <li key={lIdx} className="font-light leading-relaxed">{cleanLine}</li>;
              })}
            </ol>
          );
        }

        // Default paragraph matching
        return (
          <p key={idx} className="font-serif leading-relaxed text-gray-300 font-[300] hover:text-white transition-colors selection:bg-amber-900/30">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  // Main State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Control View State
  // "list" | "post_detail" | "new_post" | "edit_post"
  const [currentView, setCurrentView] = useState<"list" | "post_detail" | "new_post" | "edit_post">("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Auth Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");

  // Fetch initial profile context
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem("blog_auth_token");
        if (token) {
          const { user } = await api.getMe();
          setCurrentUser(user);
        }
      } catch (err) {
        console.warn("Session validation failed, user unauthenticated:", err);
        localStorage.removeItem("blog_auth_token");
      }
    };

    const fetchAllData = async () => {
      try {
        await verifyUser();
        await loadPosts();
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
      
      // Load comment tallies for each post to enrich list cards
      const countsMap: Record<string, number> = {};
      await Promise.all(
        fetchedPosts.map(async (p) => {
          try {
            const comments = await api.getComments(p.id);
            countsMap[p.id] = comments.length;
          } catch {
            countsMap[p.id] = 0;
          }
        })
      );
      setCommentCounts(countsMap);
    } catch (err) {
      console.error("Could not load posts:", err);
    }
  };

  // Auth Success helper
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadPosts(); // reload content under authenticated context
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    await api.logout();
    setCurrentUser(null);
    setCurrentView("list");
    setSelectedPostId(null);
  };

  // Open Detailed view and scroll page up
  const handleOpenDetailedPost = (id: string) => {
    setSelectedPostId(id);
    setCurrentView("post_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete current post handler
  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this blog post? This action is irreversible.")) return;

    try {
      await api.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setCurrentView("list");
      setSelectedPostId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete post.");
    }
  };

  // Refresh comment indicators for selected post
  const handleRefreshSingleCommentCount = async () => {
    if (!selectedPostId) return;
    try {
      const comments = await api.getComments(selectedPostId);
      setCommentCounts((prev) => ({
        ...prev,
        [selectedPostId]: comments.length
      }));
    } catch {
      // ignore silently
    }
  };

  // Filter posts list
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPost = posts.find((p) => p.id === selectedPostId);

  // Helper formatting for main header
  const getCurrentFormattedTime = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div id="blog-app-root" className="min-h-screen bg-[#0a0a0b] text-gray-300 selection:bg-amber-950/40 font-sans">
      
      {/* Top Status Bar / Editorial Header */}
      <header className="border-b border-[#1f1f23] bg-[#0a0a0b]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            
            {/* Logo/Brand */}
            <div 
              id="app-logo"
              onClick={() => { setCurrentView("list"); setSelectedPostId(null); }}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center text-black font-serif font-black text-xl shadow-xs group-hover:bg-amber-400 group-hover:scale-105 transition-all">
                C
              </div>
              <div>
                <h1 className="font-serif text-lg md:text-xl font-normal tracking-tight text-white">
                  The Column
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-amber-450/70 uppercase hidden sm:block">
                  Modern Editorial Platform
                </p>
              </div>
            </div>

            {/* Quick Live Search Bar (Only shown on list page) */}
            {currentView === "list" && (
              <div className="hidden sm:flex items-center flex-1 max-w-sm relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter essays or columnists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#15151a] pl-9 pr-4 py-1.5 rounded-md border border-[#1f1f23] text-xs font-sans text-white placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 transition-all"
                />
              </div>
            )}

            {/* Authenticated / Visitor Panel Actions */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2.5 md:gap-4">
                  {/* Register essay action */}
                  {currentView === "list" && (
                    <button
                      id="create-header-btn"
                      onClick={() => setCurrentView("new_post")}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 md:py-2 bg-white hover:bg-amber-50 text-black text-xs font-bold uppercase tracking-widest rounded-md transition-colors shrink-0 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-black" />
                      <span className="hidden md:inline">Write Essay</span>
                      <span className="md:hidden">Draft</span>
                    </button>
                  )}

                  {/* Profile badge details */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-950/20 border border-amber-900/35 font-mono font-semibold text-xs text-amber-300 flex items-center justify-center uppercase shrink-0">
                      {currentUser.username.slice(0, 2)}
                    </div>
                    <span className="font-sans font-medium text-xs text-gray-300 hidden lg:block">
                      {currentUser.username}
                    </span>
                  </div>

                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-gray-550 hover:text-rose-500 hover:bg-[#15151a]/40 transition-all shrink-0 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="signin-header-btn"
                    onClick={() => { setAuthInitialMode("login"); setAuthModalOpen(true); }}
                    className="text-xs font-sans font-bold text-gray-300 hover:text-white px-3 py-1.5 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="register-header-btn"
                    onClick={() => { setAuthInitialMode("register"); setAuthModalOpen(true); }}
                    className="px-3.5 py-1.5 bg-white text-black hover:bg-amber-55 text-xs font-bold uppercase tracking-widest rounded-md transition-colors shadow-xs cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-2 border-gray-800 border-t-amber-400 rounded-full animate-spin"></div>
            <p className="font-mono text-xs text-amber-500/80 uppercase tracking-widest">Synchronizing Editorial Cache...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* View 1: List View */}
            {currentView === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-10"
              >
                {/* Hero Platform Intro */}
                <div className="bg-[#0d0d0f] border border-[#1f1f23] p-6 md:p-12 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-amber-400/80 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{getCurrentFormattedTime()}</span>
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight">
                      Insights on Systems, Design, and <span className="italic text-amber-100">Digital Craft</span>.
                    </h2>
                    <p className="font-sans text-sm md:text-base leading-relaxed text-gray-450 font-light max-w-xl">
                      A quiet, high-contrast corner for technical perspectives, editorial essays, and deep exploration. Register today to publish articles and dialogue with fellow authors.
                    </p>
                  </div>

                  {/* Right hand Action panel for Guests */}
                  {!currentUser && (
                    <div className="p-5 bg-[#15151a] border border-[#1f1f23] rounded-xl w-full md:w-auto shrink-0 max-w-xs space-y-3 shadow-xl">
                      <p className="text-xs font-sans text-gray-400 leading-relaxed font-light">
                        Create an account to start cataloging essays, redrafting manuscripts, and responding directly.
                      </p>
                      <button
                        id="hero-register-btn"
                        onClick={() => { setAuthInitialMode("register"); setAuthModalOpen(true); }}
                        className="w-full text-center py-2 bg-white hover:bg-amber-50 text-black text-xs font-bold uppercase tracking-widest rounded-md transition-colors cursor-pointer border border-[#1f1f23]"
                      >
                        Register Account
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Filter view only */}
                <div className="sm:hidden block relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filter essays & columnists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#15151a] pl-9 pr-4 py-2 rounded-lg border border-[#1f1f23] text-xs font-sans text-white placeholder:text-gray-650 focus:outline-hidden"
                  />
                </div>

                {/* Header section of the lists */}
                <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-[#9c9ca3] flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5 text-amber-500/70" />
                    Latest Publications ({filteredPosts.length})
                  </h3>
                </div>

                {/* Posts Grid Layout */}
                {filteredPosts.length === 0 ? (
                  <div className="py-20 text-center bg-[#0d0d0f] border border-[#1f1f23] rounded-xl space-y-2">
                    <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto" />
                    <p className="font-sans font-semibold text-white text-sm">No essays found matching your filter</p>
                    <p className="text-xs text-gray-500 font-light">Try adjusting your query term or create a new essay post!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {filteredPosts.map((post) => (
                      <BlogCard
                        key={post.id}
                        post={post}
                        commentsCount={commentCounts[post.id] || 0}
                        onClick={() => handleOpenDetailedPost(post.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* View 2: Essay Detail View */}
            {currentView === "post_detail" && selectedPost && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                {/* Back Link */}
                <button
                  id="back-list-btn"
                  onClick={() => { setCurrentView("list"); setSelectedPostId(null); }}
                  className="group inline-flex items-center gap-1.5 text-xs text-gray-450 hover:text-amber-200 font-mono uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  Back to Publications
                </button>

                {/* Article Block */}
                <article className="bg-[#0d0d0f] border border-[#1f1f23] p-6 md:p-12 rounded-xl shadow-2xl space-y-6">
                  
                  {/* Meta Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-gray-550 border-b border-[#1f1f23] pb-4">
                    <span className="flex items-center gap-1 font-sans font-medium text-amber-200">
                      <UserIcon className="w-3.5 h-3.5 text-amber-400/80" />
                      <span>{selectedPost.authorName}</span>
                    </span>
                    <span className="w-1 h-1 bg-[#1f1f23] rounded-full"></span>
                    <span className="text-gray-450 italic">
                      {new Date(selectedPost.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    {selectedPost.updatedAt !== selectedPost.createdAt && (
                      <>
                        <span className="w-1 h-1 bg-[#1f1f23] rounded-full"></span>
                        <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-450 bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded-sm">Redrafted</span>
                      </>
                    )}
                  </div>

                  {/* Essay Heading */}
                  <h1 className="font-serif text-3xl md:text-5xl font-light text-white tracking-tight leading-tight">
                    {selectedPost.title}
                  </h1>

                  {/* Actions (Only for Author) */}
                  {currentUser?.id === selectedPost.authorId && (
                    <div className="flex items-center justify-end gap-2.5 bg-[#15151a] p-2.5 rounded-lg border border-[#1f1f23]">
                      <span className="text-[10px] font-mono text-amber-400/70 uppercase tracking-wider mr-auto pl-1.5">You own this Essay</span>
                      
                      <button
                        id="edit-post-trigger"
                        onClick={() => setCurrentView("edit_post")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-black hover:bg-amber-100 border border-[#1f1f23] text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Outline
                      </button>
                      <button
                        id="delete-post-trigger"
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 border border-rose-900/45 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Retract Post
                      </button>
                    </div>
                  )}

                  {/* Body Content Essay Renderer */}
                  <div className="prose prose-invert max-w-none pt-4">
                    <EssayMarkdownRenderer content={selectedPost.content} />
                  </div>

                  {/* Interaction dialogue thread */}
                  <CommentsList
                    postId={selectedPost.id}
                    postAuthorId={selectedPost.authorId}
                    currentUser={currentUser}
                    onOpenAuth={() => { setAuthInitialMode("login"); setAuthModalOpen(true); }}
                    onCommentsUpdated={handleRefreshSingleCommentCount}
                  />

                </article>
              </motion.div>
            )}

            {/* View 3: New / Edit Post UI form */}
            {(currentView === "new_post" || currentView === "edit_post") && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                <BlogForm
                  postToEdit={currentView === "edit_post" ? selectedPost : null}
                  onCancel={() => {
                    if (currentView === "edit_post") {
                      setCurrentView("post_detail");
                    } else {
                      setCurrentView("list");
                      setSelectedPostId(null);
                    }
                  }}
                  onSuccess={(savedPost) => {
                    // Update state to include the post
                    if (currentView === "edit_post") {
                      setPosts((prev) => prev.map((p) => p.id === savedPost.id ? savedPost : p));
                      setCurrentView("post_detail");
                    } else {
                      setPosts((prev) => [savedPost, ...prev]);
                      setSelectedPostId(savedPost.id);
                      setCurrentView("post_detail");
                    }
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Styled Footer */}
      <footer className="border-t border-[#1f1f23] bg-[#0d0d0f] py-12 mt-20 text-center">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-2">
          <p className="font-serif text-white tracking-wide text-sm font-medium">
            The Column Blogging Platform
          </p>
          <p className="text-gray-500 font-light font-sans">
            Built with modern React, Express RESTful architecture, and a persistent server storage system database.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4 text-gray-600 text-[10px] font-mono uppercase tracking-widest">
            <span>Server Native DB</span>
            <span>•</span>
            <span>Est. 2026</span>
            <span>•</span>
            <span>No telemetry is tracking you</span>
          </div>
        </div>
      </footer>

      {/* Auth Register/Login Overlay Modal popup */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
