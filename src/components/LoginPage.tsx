import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Chrome,
  FileText,
  Award,
  Briefcase,
  BarChart3,
  CheckCircle,
  FileSearch
} from "lucide-react";
import { User, UserRole } from "../types";

interface LoginPageProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('candidate');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      // Simulate Google OAuth flow
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
    <div id="login-page-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 md:p-12 font-sans selection:bg-teal-500/20 selection:text-teal-300 relative overflow-hidden bg-grid-pattern">
      {/* Immersive animated background glows */}
      <motion.div
        animate={{
          x: [-100, 150, -50, -100],
          y: [-50, 100, 150, -50],
          scale: [1, 1.35, 0.8, 1],
          rotate: [0, 120, 240, 360]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[10%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-teal-500/18 via-cyan-500/12 to-emerald-500/8 blur-[110px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [100, -120, 80, 100],
          y: [150, -50, 100, 150],
          scale: [1.2, 0.85, 1.25, 1.2],
          rotate: [360, 240, 120, 0]
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-[15%] -right-[15%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-fuchsia-500/18 via-purple-500/12 to-indigo-500/8 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [120, -60, 90, 120],
          y: [-100, 80, -60, -100],
          scale: [0.95, 1.2, 0.9, 0.95],
          rotate: [0, -180, -360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[25%] -right-[5%] w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-amber-500/12 via-rose-500/12 to-teal-500/4 blur-[90px] pointer-events-none z-0"
      />

      {/* Floating subtle star particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 1200 - 100, 
              y: Math.random() * 800 + 400, 
              opacity: Math.random() * 0.5 + 0.15,
              scale: Math.random() * 0.7 + 0.3 
            }}
            animate={{ 
              y: -100,
              x: `calc(10vw + ${Math.sin(i) * 60}px)`
            }}
            transition={{
              duration: Math.random() * 18 + 12,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5
            }}
            className="absolute w-2 h-2 bg-teal-400 rounded-full blur-[1.5px]"
          />
        ))}
      </div>

      {/* Centered branding header */}
      <div className="flex flex-col items-center gap-3 mb-8 z-10 select-none">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/25 animate-pulse">
          <FileSearch className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-display">Resume Analyzer</h1>
          <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono font-bold block mt-0.5">
            AI Recruit-Match Suite
          </span>
        </div>
      </div>

      {/* Main interactive card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="backdrop-blur-2xl bg-slate-900/65 border border-teal-500/20 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(20,184,166,0.15)] hover:shadow-[0_0_60px_rgba(20,184,166,0.25)] relative z-10 transition-all duration-500"
      >
        {/* Form header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            {isSignUp ? "Create Your Free Account" : "Access AI Recruit-Match"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {isSignUp 
              ? "Gain instant access to ATS scoring dashboards and pipeline tracking." 
              : "Sign in to run premium analyses, track jobs, and access HR dashboards."
            }
          </p>
        </div>

        {/* Role selector to establish persona */}
        <div className="space-y-2">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">
            Identify Your Workspace Persona
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-900 shadow-inner">
            <button
              id="select-role-candidate"
              type="button"
              onClick={() => setRole('candidate')}
              className={`py-2 text-xs font-bold rounded-lg transition option-key-glow ${role === 'candidate' ? 'option-key-selected text-teal-400 border border-teal-500/20' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}
            >
              Candidate Profile
            </button>
            <button
              id="select-role-hr"
              type="button"
              onClick={() => setRole('hr')}
              className={`py-2 text-xs font-bold rounded-lg transition option-key-glow ${role === 'hr' ? 'option-key-selected text-teal-400 border border-teal-500/20' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}
            >
              HR Recruiter
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Core Sign-In / Sign-Up Form */}
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
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 active:scale-[0.97] disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow shadow-teal-500/20 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            {isLoading ? "Authenticating..." : isSignUp ? "Complete Onboarding" : "Sign In to Workspace"}
            <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
          </button>
        </form>

        {/* Social Auth Separator */}
        <div className="relative text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-850"></div>
          <span className="text-[9px] text-slate-500 font-mono relative bg-slate-900/60 px-3 uppercase tracking-widest font-bold">
            Or continue with
          </span>
        </div>

        {/* One-click quick demo login button */}
        <button
          id="google-oauth-btn"
          type="button"
          onClick={handleGoogleOAuthSimulate}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-200 font-bold text-xs rounded-xl transition option-key-glow hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] flex items-center justify-center gap-2"
        >
          <Chrome className="h-4 w-4 text-teal-400" />
          Sign In with Google Account
        </button>

        {/* Toggle between modes */}
        <div className="text-center pt-2">
          <button
            id="toggle-auth-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage("");
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold transition underline underline-offset-4 decoration-slate-800"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one free"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
