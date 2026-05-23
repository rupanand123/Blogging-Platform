import React, { useState, useEffect } from "react";
import { BlogComment, User } from "../types";
import { api } from "../api";
import { Trash2, MessageSquare, CornerDownRight, Plus, LogIn, Clock } from "lucide-react";

interface CommentsListProps {
  postId: string;
  postAuthorId: string;
  currentUser: User | null;
  onOpenAuth: () => void;
  // Let parent components know when comment list is refreshed so they can renew counts
  onCommentsUpdated?: () => void;
}

export default function CommentsList({ 
  postId, 
  postAuthorId, 
  currentUser, 
  onOpenAuth,
  onCommentsUpdated 
}: CommentsListProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Could not fetch comments for post:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await api.createComment(postId, newContent);
      setComments((prev) => [...prev, response]);
      setNewContent("");
      if (onCommentsUpdated) {
        onCommentsUpdated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to retract this comment?")) return;

    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onCommentsUpdated) {
        onCommentsUpdated();
      }
    } catch (err: any) {
      alert(err.message || "Could not retract comment.");
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="comments-section" className="border-t border-[#1f1f23] pt-8 mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <h3 className="font-serif text-lg md:text-xl font-normal text-white">
            Discussion Thread
          </h3>
        </div>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{comments.length} Thoughts</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-955/20 border border-rose-900/40 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Comment Form / Sign in banner */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-950/20 border border-amber-900/35 flex items-center justify-center font-bold text-xs text-amber-300 tracking-wide font-mono shrink-0 uppercase">
            {currentUser.username.slice(0, 2)}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write a thought..."
              className="w-full px-3 py-2.5 bg-[#15151a] border border-[#1f1f23] rounded-lg font-sans text-xs text-white placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                id="post-comment-btn"
                type="submit"
                disabled={submitting || !newContent.trim()}
                className="inline-flex items-center gap-1 px-4 py-1.5 bg-white text-black hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 cursor-pointer rounded-md text-[11px] font-sans font-bold tracking-widest uppercase transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {submitting ? "Posting..." : "Post Thought"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-[#15151a] border border-[#1f1f23] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-white font-sans uppercase tracking-widest">Join the discussion</h4>
            <p className="text-xs text-gray-500 font-light mt-0.5">Authenticate to register opinions on this editorial.</p>
          </div>
          <button
            id="comments-login-prompt-btn"
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-amber-400 text-xs font-bold uppercase tracking-widest rounded-md transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>
      )}

      {/* List of comments */}
      {loading && comments.length === 0 ? (
        <div className="text-center py-6 text-xs text-amber-400/40 font-mono tracking-widest uppercase">
          Loading conversation thread...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 bg-[#0d0d0f] border border-dashed border-[#1f1f23] rounded-xl text-xs text-gray-500 font-sans">
          No comments have been posted to this essay yet. Be the first to express your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isCommentAuthor = currentUser?.id === comment.authorId;
            const isPostAuthor = currentUser?.id === postAuthorId;
            const canDelete = isCommentAuthor || isPostAuthor;

            return (
              <div 
                id={`comment-${comment.id}`}
                key={comment.id} 
                className="group p-4 bg-[#0d0d0f] border border-[#1f1f23] rounded-xl flex gap-3 transition-colors hover:bg-[#111114]"
              >
                {/* Visual circle avatar */}
                <div className="w-8 h-8 rounded-full bg-[#15151a] border border-[#1f1f23] text-amber-200/90 flex items-center justify-center font-bold text-xs tracking-wide font-mono uppercase shrink-0">
                  {comment.authorName.slice(0, 2)}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-xs text-white">{comment.authorName}</span>
                      {comment.authorId === postAuthorId && (
                        <span className="font-mono text-[9px] bg-amber-950/40 border border-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded-sm uppercase font-semibold">
                          Author
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-gray-650" />
                        <span>{formatDate(comment.createdAt)}</span>
                      </span>

                      {canDelete && (
                        <button
                          id={`delete-comment-${comment.id}`}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <p className="font-sans text-xs text-gray-400 font-light leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
