import React, { useState, useEffect } from "react";
import { BlogPost } from "../types";
import { api } from "../api";
import { Save, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";

interface BlogFormProps {
  postToEdit?: BlogPost | null;
  onSuccess: (post: BlogPost) => void;
  onCancel: () => void;
}

export default function BlogForm({ postToEdit, onSuccess, onCancel }: BlogFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
    } else {
      setTitle("");
      setContent("");
    }
    setError(null);
  }, [postToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Initial validations
    if (title.trim().length < 5) {
      setError("The title is too short. It must be at least 5 characters.");
      return;
    }
    if (content.trim().length < 10) {
      setError("The body content must be at least 10 characters long.");
      return;
    }

    setLoading(true);
    try {
      let savedPost: BlogPost;
      if (postToEdit) {
        savedPost = await api.updatePost(postToEdit.id, title, content);
      } else {
        savedPost = await api.createPost(title, content);
      }
      onSuccess(savedPost);
    } catch (err: any) {
      setError(err.message || "Failed to catalog the blog post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="blog-form-container" className="max-w-3xl mx-auto py-4">
      {/* Back Header */}
      <button
        id="cancel-form-btn"
        onClick={onCancel}
        className="group inline-flex items-center gap-1.5 text-xs text-gray-450 hover:text-amber-200 font-mono uppercase tracking-widest mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        Discard / Back to list
      </button>

      {/* Main Drafting Slate */}
      <div className="bg-[#0d0d0f] border border-[#1f1f23] p-6 md:p-10 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-[#15151a] rounded-lg border border-[#1f1f23]">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-normal tracking-tight text-white">
            {postToEdit ? <>Redraft <span className="italic text-amber-50">Essay</span></> : <>Draft a New <span className="italic text-amber-50">Essay</span></>}
          </h2>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-rose-950/20 border border-rose-900/45 rounded-lg text-rose-350 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-455 uppercase tracking-widest text-[#9c9ca3]">
              Essay Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Architecture of Silence"
              className="w-full px-4 py-3 bg-[#15151a] border border-[#1f1f23] rounded-lg font-serif text-lg text-white placeholder:text-gray-600 focus:outline-hidden focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            <p className="text-[11px] text-gray-500 font-mono">
              Title must be crisp and hold at least 5 characters. ({title.trim().length} current)
            </p>
          </div>

          {/* Content TextArea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#9c9ca3] flex justify-between">
              <span>Essay Body</span>
              <span className="text-[10px] lowercase text-amber-400/50 font-mono font-normal">Supports standard markdown formatting</span>
            </label>
            <textarea
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start drafting here... Use standard layout principles, lists, and headings to convey the perspective clearly."
              className="w-full px-4 py-3 bg-[#15151a] border border-[#1f1f23] rounded-lg font-sans text-sm text-gray-300 leading-relaxed placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-y min-h-[250px]"
            />
            <div className="flex justify-between text-[11px] text-gray-500 font-mono">
              <span>Body must be at least 10 characters long.</span>
              <span>{content.trim().length} characters drafted</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#1f1f23]">
            <button
              id="form-cancel-secondary"
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-[#15151a] hover:bg-[#1f1f23] text-gray-400 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors border border-[#1f1f23] cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-post-btn"
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white text-black hover:bg-amber-50 text-xs font-bold uppercase tracking-widest rounded-md transition-colors shadow-xs cursor-pointer disabled:bg-gray-750 disabled:text-gray-500"
            >
              <Save className="w-4 h-4 text-black" />
              {loading ? "Cataloging..." : postToEdit ? "Update Story" : "Publish Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
