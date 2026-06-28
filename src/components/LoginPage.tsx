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
    <div id="login-page-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-teal-500/20 selection:text-teal-300 relative overflow-x-hidden bg-grid-pattern">
      {/* Immersive radial glows */}
      <div className="absolute top-[-15%] right-[-15%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Left Column: Splash & Features Intro */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-900/40 backdrop-blur-md border-r border-slate-900 p-12 flex-col justify-between relative overflow-hidden z-10">
        {/* Decorative ambient background spots */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding header */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-base shadow shadow-teal-500/10">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-100 font-display">Resume Analyzer</h1>
            <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono font-bold block -mt-0.5">
              AI Recruit-Match Suite
            </span>
          </div>
        </div>

        {/* Key Product Highlights list */}
        <div className="space-y-8 my-auto z-10 max-w-sm">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-100 tracking-tight leading-snug font-display bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Secure your next career milestone.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              A comprehensive recruiter-grade toolkit to scan resume drafts, verify professional certifications, match open jobs, and analyze talent pipelines.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/40 hover:border-slate-800 transition">
              <div className="p-1.5 bg-slate-950 rounded-lg text-teal-400 border border-slate-850 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Interactive Resume Audits</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Generate instant feedback, technical skills gap analysis, and calculated callback chance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/40 hover:border-slate-800 transition">
              <div className="p-1.5 bg-slate-950 rounded-lg text-teal-400 border border-slate-850 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Credential Verification</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Verify credential layouts and certificate metadata with deep verification algorithms.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/40 hover:border-slate-800 transition">
              <div className="p-1.5 bg-slate-950 rounded-lg text-teal-400 border border-slate-850 shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-display">Recruiter Pipeline Analytics</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Track submissions, aggregate team metrics, and unlock premium talent channels.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info label */}
        <div className="text-[11px] text-slate-500 font-mono font-medium z-10">
          Powered by Gemini 2.5 Flash • Secure Sandboxed Sessions
        </div>
      </div>

      {/* Right Column: Dynamic Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Small branding header on mobile */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
            <FileSearch className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-100">Resume Analyzer</h1>
            <span className="text-[9px] uppercase tracking-wider text-teal-400 font-mono font-bold block">
              AI Recruit-Match Suite
            </span>
          </div>
        </div>

        {/* Main interactive card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative z-10"
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
            <span className="text-[9px] text-slate-500 font-mono relative bg-slate-900 px-3 uppercase tracking-widest font-bold">
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

    </div>
  );
}
