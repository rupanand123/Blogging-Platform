import { BlogPost } from "../types";
import { Clock, User, ArrowRight, MessageSquare } from "lucide-react";

interface BlogCardProps {
  key?: string;
  post: BlogPost;
  onClick: () => void;
  commentsCount?: number;
}

export default function BlogCard({ post, onClick, commentsCount = 0 }: BlogCardProps) {
  // Helper to calculate reading time
  const readingTime = (content: string): number => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220)); // Average reading speed 220WPM
  };

  // Helper to format date
  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Strip Markdown markers briefly for excerpt
  const getExcerpt = (text: string, limit: number = 180): string => {
    const stripped = text
      .replace(/[#*`_\[\]]/g, "") // remove basic MD
      .replace(/\s+/g, " ")
      .trim();
    if (stripped.length <= limit) return stripped;
    return stripped.slice(0, limit) + "...";
  };

  return (
    <article 
      id={`post-card-${post.id}`}
      onClick={onClick}
      className="group cursor-pointer bg-[#0d0d0f] p-6 md:p-8 rounded-xl border border-[#1f1f23] hover:border-amber-500/40 hover:shadow-xl hover:shadow-black/70 transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        {/* Meta Header */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-mono text-gray-500">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-amber-200/80 font-sans font-medium">{post.authorName}</span>
          </span>
          <span className="w-1 h-1 bg-[#1f1f23] rounded-full"></span>
          <span className="text-amber-400/60 italic">{formatDate(post.createdAt)}</span>
          <span className="w-1 h-1 bg-[#1f1f23] rounded-full"></span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{readingTime(post.content)} min read</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-white group-hover:text-amber-200 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="font-sans text-sm leading-relaxed text-gray-400 font-light">
          {getExcerpt(post.content)}
        </p>
      </div>

      {/* Footer link trigger */}
      <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#1f1f23]">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <MessageSquare className="w-3.5 h-3.5 text-amber-500/50" />
          <span className="font-sans font-medium text-gray-400">
            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
          </span>
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1.5 transition-all duration-200">
          Open Essay
          <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
        </span>
      </div>
    </article>
  );
}
