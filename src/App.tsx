import React, { useState } from "react";
import { 
  FileText, 
  Award, 
  Briefcase, 
  BarChart3, 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  FileSearch,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { User, ResumeAnalysis, CertificateAnalysis } from "./types";
import ResumeAnalyzerTab from "./components/ResumeAnalyzerTab";
import CertificateAnalyzerTab from "./components/CertificateAnalyzerTab";
import JobsTab from "./components/JobsTab";
import HRAnalyticsTab from "./components/HRAnalyticsTab";
import ChatBotSidebar from "./components/ChatBotSidebar";
import AuthModal from "./components/AuthModal";
import LoginPage from "./components/LoginPage";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("auth_token");
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<'resume' | 'certificate' | 'jobs' | 'hr'>('resume');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Theme state: can be 'slate', 'light', or 'system' (synchronizes with OS)
  const [theme, setTheme] = useState<'slate' | 'light' | 'system'>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === 'slate' || saved === 'light' || saved === 'system') {
      return saved as 'slate' | 'light' | 'system';
    }
    return 'system'; // Default to system OS preference sync
  });

  // Track system preference state using matchMedia
  const [systemTheme, setSystemTheme] = useState<'slate' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'slate' : 'light';
    }
    return 'slate';
  });

  // Keep systemTheme state synchronized with OS settings
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'slate' : 'light');
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Determine active theme (resolves 'system' theme to the system's choice)
  const currentActiveTheme = theme === 'system' ? systemTheme : theme;

  React.useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    if (currentActiveTheme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [theme, currentActiveTheme]);

  // Synchronize authentication state to localStorage
  React.useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("current_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("current_user");
      }
    } catch (e) {
      console.error("Failed to sync current_user to storage:", e);
    }
  }, [currentUser]);

  React.useEffect(() => {
    try {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch (e) {
      console.error("Failed to sync auth_token to storage:", e);
    }
  }, [token]);
  
  // Track last analysis to dynamically recommend jobs
  const [lastResumeAnalysis, setLastResumeAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setToken(token);
    // If logged in as HR, direct them to HR tab
    if (user.role === 'hr') {
      setActiveTab('hr');
    } else {
      setActiveTab('resume');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setActiveTab('resume');
  };

  const handlePremiumSuccess = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };
  if (!currentUser) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-300 relative overflow-x-hidden bg-grid-pattern">
      {/* Ambient glowing atmospheric gradient circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Top Header Navigation */}
      <header className="border-b border-slate-900/60 bg-slate-950/75 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow shadow-teal-500/10">
              <FileSearch className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-100">Resume Analyzer</h1>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold block -mt-0.5">
                AI Recruit-Match Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-900 shadow-inner">
            <button
              id="nav-resume-tab"
              onClick={() => setActiveTab('resume')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 option-key-glow ${activeTab === 'resume' ? 'option-key-selected text-teal-400 border border-teal-500/30' : 'text-slate-400 border border-transparent'}`}
            >
              <FileText className="h-3.5 w-3.5" />
              Resume Analyzer
            </button>
            <button
              id="nav-certificate-tab"
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 option-key-glow ${activeTab === 'certificate' ? 'option-key-selected text-teal-400 border border-teal-500/30' : 'text-slate-400 border border-transparent'}`}
            >
              <Award className="h-3.5 w-3.5" />
              Certificate Assessor
            </button>
            <button
              id="nav-jobs-tab"
              onClick={() => setActiveTab('jobs')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 option-key-glow ${activeTab === 'jobs' ? 'option-key-selected text-teal-400 border border-teal-500/30' : 'text-slate-400 border border-transparent'}`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Jobs Board
            </button>
            <button
              id="nav-hr-tab"
              onClick={() => setActiveTab('hr')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 option-key-glow ${activeTab === 'hr' ? 'option-key-selected text-teal-400 border border-teal-500/30' : 'text-slate-400 border border-transparent'}`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              HR Analytics
            </button>
          </nav>

          {/* Auth Trigger Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={() => {
                if (theme === 'slate') setTheme('light');
                else if (theme === 'light') setTheme('system');
                else setTheme('slate');
              }}
              className="p-2 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-teal-400 transition cursor-pointer flex items-center justify-center h-9 w-9 shrink-0"
              title={
                theme === 'slate' 
                  ? "Slate Dark Mode. Click for Light Mode." 
                  : theme === 'light' 
                    ? "High-Contrast Light Mode. Click to sync with System OS preference." 
                    : `Synchronized with System OS (${currentActiveTheme === 'slate' ? 'Slate Dark' : 'Light'}). Click for Slate Dark Mode.`
              }
            >
              {theme === 'slate' && <Moon className="h-4.5 w-4.5" />}
              {theme === 'light' && <Sun className="h-4.5 w-4.5 text-amber-500 animate-[spin_10s_linear_infinite]" />}
              {theme === 'system' && (
                <div className="relative">
                  <Monitor className="h-4.5 w-4.5 text-teal-400" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-slate-950 animate-pulse" />
                </div>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    {currentUser.role === 'hr' ? 'HR Recruiter' : 'Candidate'} 
                    {currentUser.isPremium && ' • Premium'}
                  </span>
                </div>
                <button
                  id="auth-logout-btn"
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition"
                  title="Sign Out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-auth-trigger"
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow shadow-teal-500/10"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Sign In / Join
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden border-b border-slate-900 bg-slate-950/80 backdrop-blur px-4 py-2">
        <div className="grid grid-cols-4 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
          <button
            id="mobile-nav-resume-tab"
            onClick={() => setActiveTab('resume')}
            className={`py-2 text-[10px] font-bold rounded-lg transition flex flex-col items-center justify-center gap-1 ${activeTab === 'resume' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Resume
          </button>
          <button
            id="mobile-nav-certificate-tab"
            onClick={() => setActiveTab('certificate')}
            className={`py-2 text-[10px] font-bold rounded-lg transition flex flex-col items-center justify-center gap-1 ${activeTab === 'certificate' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Award className="h-3.5 w-3.5" />
            Cert
          </button>
          <button
            id="mobile-nav-jobs-tab"
            onClick={() => setActiveTab('jobs')}
            className={`py-2 text-[10px] font-bold rounded-lg transition flex flex-col items-center justify-center gap-1 ${activeTab === 'jobs' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Jobs
          </button>
          <button
            id="mobile-nav-hr-tab"
            onClick={() => setActiveTab('hr')}
            className={`py-2 text-[10px] font-bold rounded-lg transition flex flex-col items-center justify-center gap-1 ${activeTab === 'hr' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            HR
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner callout for trial limits if guest */}
        {!currentUser && (
          <div className="mb-6 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 h-fit">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-400">Sandbox Trial Mode</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">
                  You are analyzing as a guest. Create a free account or login to save your analyses and view custom interview questions.
                </p>
              </div>
            </div>
            <button
              id="banner-auth-trigger"
              onClick={() => setIsAuthOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0 self-start sm:self-center"
            >
              Onboard Free <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab switcher renderer */}
        {activeTab === 'resume' && (
          <ResumeAnalyzerTab 
            token={token} 
            onAnalysisSuccess={(analysis) => setLastResumeAnalysis(analysis)} 
            currentUser={currentUser}
            onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          />
        )}

        {activeTab === 'certificate' && (
          <CertificateAnalyzerTab 
            token={token}
            onAnalysisSuccess={() => {}} 
          />
        )}

        {activeTab === 'jobs' && (
          <JobsTab 
            lastAnalysis={lastResumeAnalysis} 
            currentUser={currentUser}
            token={token}
            onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          />
        )}

        {activeTab === 'hr' && (
          <HRAnalyticsTab 
            token={token} 
            currentUser={currentUser} 
            onPremiumSuccess={handlePremiumSuccess} 
          />
        )}
      </main>

      {/* Bottom Footer block */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-slate-500 text-xs font-medium font-mono">
        <p>© 2026 Resume Analyzer Corp. Crafted with high-contrast slate aesthetics.</p>
      </footer>

      {/* Floating Chatbot Bubble Trigger */}
      <button
        id="chatbot-floating-trigger"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-full shadow-2xl transition hover:scale-105 active:scale-95 duration-150 z-40 flex items-center justify-center"
        title="Resume Design Assistant"
      >
        <MessageSquare className="h-5.5 w-5.5" />
      </button>

      {/* Persistent Chatbot Sidebar Drawer */}
      <ChatBotSidebar 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* Authentication Onboarding Dialog */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
