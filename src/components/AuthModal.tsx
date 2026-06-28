import React, { useState } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Chrome
} from "lucide-react";
import { User, UserRole } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('candidate');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMessage("Name is required.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp ? { name, email, password, role } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMessage(data.error || "Authentication failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error talking to database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthSimulate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Simulate OAuth flow
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "S Sriharan",
          email: "sriharan6320@gmail.com",
          googleId: "google-10492839482934",
          role: role
        })
      });

      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMessage(data.error || "Google Sign-In failed.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Google OAuth communication issue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md p-6 relative space-y-6 shadow-2xl">
        {/* Close */}
        <button 
          id="close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-slate-100">
            {isSignUp ? "Create Workspace Account" : "Access Resume Analyzer"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Join candidates and recruitment coordinators worldwide.
          </p>
        </div>

        {/* Role Segment Selector (only for signup or google default) */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Identify Your Workspace Persona
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850">
            <button
              id="select-role-candidate"
              type="button"
              onClick={() => setRole('candidate')}
              className={`py-2 text-xs font-bold rounded-lg transition ${role === 'candidate' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Candidate
            </button>
            <button
              id="select-role-hr"
              type="button"
              onClick={() => setRole('hr')}
              className={`py-2 text-xs font-bold rounded-lg transition ${role === 'hr' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              HR / Recruiter
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input 
                  id="auth-name-input"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S Sriharan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                />
                <UserIcon className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input 
                id="auth-email-input"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
              />
              <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                id="auth-password-input"
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-mono"
              />
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input 
                  id="auth-confirm-password-input"
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-mono"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {isLoading ? "Authenticating..." : isSignUp ? "Complete Onboarding" : "Sign In to Workspace"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="relative text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800"></div>
          <span className="text-[10px] text-slate-500 font-mono relative bg-slate-900 px-3 uppercase tracking-wider">Or continue with</span>
        </div>

        {/* Google OAuth Single-Click */}
        <button
          id="google-oauth-btn"
          type="button"
          onClick={handleGoogleOAuthSimulate}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
        >
          <Chrome className="h-4 w-4 text-teal-400" />
          Continue with Google
        </button>

        {/* Toggle signin/signup */}
        <div className="text-center">
          <button
            id="toggle-auth-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage("");
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold transition"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up free"}
          </button>
        </div>
      </div>
    </div>
  );
}
