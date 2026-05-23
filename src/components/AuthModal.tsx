import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { api } from "../api";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (!username.trim() || !email.trim() || !password) {
          throw new Error("All fields are required.");
        }
        if (username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const data = await api.register(username, email, password);
        onSuccess(data.user);
      } else {
        if (!email.trim() || !password) {
          throw new Error("Email and password are required.");
        }
        const data = await api.login(email, password);
        onSuccess(data.user);
      }
      onClose();
      // Reset form fields
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        id="auth-modal-content"
        className="w-full max-w-md bg-[#0d0d0f] rounded-xl shadow-2xl border border-[#1f1f23] overflow-hidden relative transition-transform transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1f1f23]">
          <h3 className="font-serif font-normal text-lg text-white">
            {mode === "login" ? <>Sign in to <span className="italic text-amber-100">Column</span></> : <>Become a <span className="italic text-amber-100">Columnist</span></>}
          </h3>
          <button 
            id="close-auth-modal"
            onClick={onClose} 
            className="text-gray-500 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-955/20 border border-rose-900/40 rounded-lg text-rose-350 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <p>{error}</p>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., vance_editor"
                  className="w-full pl-9 pr-4 py-2 bg-[#15151a] border border-[#1f1f23] rounded-lg font-sans text-sm text-white placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vantage.com"
                className="w-full pl-9 pr-4 py-2 bg-[#15151a] border border-[#1f1f23] rounded-lg font-sans text-sm text-white placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-9 pr-4 py-2 bg-[#15151a] border border-[#1f1f23] rounded-lg font-sans text-sm text-white placeholder:text-gray-650 focus:outline-hidden focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-white text-black hover:bg-amber-100 font-bold uppercase tracking-widest text-xs rounded-md transition-colors shadow-xs flex justify-center items-center cursor-pointer disabled:bg-gray-800 disabled:text-gray-500"
          >
            {loading ? "Verifying..." : mode === "login" ? "Sign In" : "Register Columnist"}
          </button>

          <div className="pt-3 text-center border-t border-[#1f1f23] text-xs text-gray-500">
            {mode === "login" ? (
              <span>
                New to the platform?{" "}
                <button
                  type="button"
                  onClick={() => { setError(null); setMode("register"); }}
                  className="font-bold text-amber-405 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setError(null); setMode("login"); }}
                  className="font-bold text-amber-405 hover:text-amber-300 hover:underline cursor-pointer"
                >
                  Sign in instead
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
