import React, { useState, useEffect } from "react";
import { 
  Users, 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Trophy,
  Calendar,
  Video,
  Clock,
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { HRAnalytics, User } from "../types";
import RadarChart from "./RadarChart";
import AIInsightsPanel from "./AIInsightsPanel";
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from "../lib/googleAuth";

interface HRAnalyticsTabProps {
  token: string | null;
  currentUser: User | null;
  onPremiumSuccess: (updatedUser: User) => void;
}

export default function HRAnalyticsTab({ token, currentUser, onPremiumSuccess }: HRAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<HRAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  
  // Seed state
  const [isSeeding, setIsSeeding] = useState(false);

  // Google OAuth & Calendar State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleNeedsAuth, setGoogleNeedsAuth] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Persisted Interviews list state
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isInterviewsLoading, setIsInterviewsLoading] = useState(false);

  // Form State
  const [interviewTitle, setInterviewTitle] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [interviewDuration, setInterviewDuration] = useState(45);
  const [interviewDesc, setInterviewDesc] = useState("");
  const [includeMeet, setIncludeMeet] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // Listen for Google Auth changes (Firebase Auth)
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setGoogleNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setGoogleNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchInterviews = async () => {
    setIsInterviewsLoading(true);
    try {
      const res = await fetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
    } finally {
      setIsInterviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    if (selectedCandidate) {
      setInterviewTitle(`Interview: ${selectedCandidate.candidateName} - AI Recruit Match`);
      // Predict an email for candidate if they don't have one
      const sanitizedName = selectedCandidate.candidateName.toLowerCase().replace(/\s+/g, ".");
      setCandidateEmail(`${sanitizedName}@example.com`);
      // Pre-fill interviewer email
      setInterviewerEmail(currentUser?.email || "recruiter@recruitmatch.com");
      // Pre-fill description
      setInterviewDesc(`Technical interview to discuss engineering competencies.\n\nWe will review technical strengths, ATS score alignment (${selectedCandidate.overallScore} pts), and key experience markers.`);
    }
  }, [selectedCandidateId, currentUser]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setScheduleStatus(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setGoogleNeedsAuth(false);
        setScheduleStatus({ type: 'success', message: `Connected to Google Calendar successfully as ${result.user.email}!` });
      }
    } catch (err: any) {
      console.error("Google login failed", err);
      setScheduleStatus({ type: 'error', message: `Google Sign-In failed: ${err.message || err}` });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setGoogleNeedsAuth(true);
      setScheduleStatus(null);
    } catch (err) {
      console.error("Google sign out failed", err);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    if (!interviewDateTime) {
      setScheduleStatus({ type: 'error', message: "Please specify interview date and time." });
      return;
    }

    // Require explicit user confirmation for external mutations (Workspace guidelines requirement)
    const confirmed = window.confirm(
      `Confirm scheduling this interview with Google Calendar?\n\nTitle: ${interviewTitle}\nCandidate: ${candidateEmail}\nTime: ${new Date(interviewDateTime).toLocaleString()}`
    );
    if (!confirmed) return;

    setIsScheduling(true);
    setScheduleStatus(null);

    try {
      const tokenToUse = googleToken || await getAccessToken();
      if (!tokenToUse) {
        setGoogleNeedsAuth(true);
        throw new Error("No Google access token found. Please sign in with Google Calendar first.");
      }

      // 1. Create event on Google Calendar
      const startISO = new Date(interviewDateTime).toISOString();
      const endISO = new Date(new Date(interviewDateTime).getTime() + interviewDuration * 60000).toISOString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const eventBody: any = {
        summary: interviewTitle,
        description: interviewDesc,
        start: {
          dateTime: startISO,
          timeZone: timeZone
        },
        end: {
          dateTime: endISO,
          timeZone: timeZone
        },
        attendees: [
          { email: interviewerEmail, responseStatus: "accepted" },
          { email: candidateEmail }
        ],
        reminders: {
          useDefault: true
        }
      };

      if (includeMeet) {
        eventBody.conferenceData = {
          createRequest: {
            requestId: `meet-request-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        };
      }

      // Post to Google Calendar API
      const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${includeMeet ? 1 : 0}`;
      const calendarRes = await fetch(calendarUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventBody)
      });

      if (!calendarRes.ok) {
        const errDetails = await calendarRes.json();
        console.error("Google Calendar API Error details:", errDetails);
        throw new Error(errDetails.error?.message || "Failed to create Google Calendar event.");
      }

      const calendarEvent = await calendarRes.json();
      const googleEventId = calendarEvent.id;
      const meetLink = calendarEvent.hangoutLink || "";

      // 2. Persist in local database via backend API
      const localRes = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          resumeId: selectedCandidate.resumeId,
          candidateName: selectedCandidate.candidateName,
          title: interviewTitle,
          interviewerEmail: interviewerEmail,
          candidateEmail: candidateEmail,
          dateTime: startISO,
          durationMinutes: interviewDuration,
          description: interviewDesc,
          meetLink: meetLink,
          googleEventId: googleEventId
        })
      });

      if (!localRes.ok) {
        throw new Error("Interview scheduled on Google Calendar, but failed to save to the local database.");
      }

      setScheduleStatus({
        type: 'success',
        message: `Interview scheduled and synchronized with Google Calendar successfully! ${meetLink ? 'Google Meet link generated.' : ''}`
      });

      // Reset datetime-picker
      setInterviewDateTime("");
      
      // Refresh interviews list
      fetchInterviews();
    } catch (err: any) {
      console.error("Scheduling failed:", err);
      setScheduleStatus({ type: 'error', message: `Scheduling failed: ${err.message || err}` });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelInterview = async (interviewId: string, googleEventId?: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel and delete this interview? This will remove the event from Google Calendar and delete it from your dashboard."
    );
    if (!confirmed) return;

    try {
      // 1. Delete from Google Calendar if we have an event id and token
      if (googleEventId) {
        const tokenToUse = googleToken || await getAccessToken();
        if (tokenToUse) {
          const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`;
          await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${tokenToUse}`
            }
          });
        }
      }

      // 2. Delete from local database
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });

      if (res.ok) {
        fetchInterviews();
        setScheduleStatus({ type: 'success', message: "Interview cancelled and deleted successfully from Google Calendar." });
      } else {
        throw new Error("Failed to delete interview from dashboard database.");
      }
    } catch (err: any) {
      console.error("Failed to cancel interview:", err);
      setScheduleStatus({ type: 'error', message: `Failed to cancel: ${err.message || err}` });
    }
  };



  useEffect(() => {
    if (analytics && analytics.rankings.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(analytics.rankings[0].resumeId);
    }
  }, [analytics, selectedCandidateId]);

  const selectedCandidate = analytics?.rankings.find(r => r.resumeId === selectedCandidateId) || (analytics?.rankings.length ? analytics.rankings[0] : null);

  const fetchAnalytics = async () => {
    if (!currentUser?.isPremium) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr/analytics", {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser?.isPremium]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    
    // Simulate payment gateway delay (Stripe / PayPal API integration response simulation)
    setTimeout(async () => {
      try {
        const res = await fetch("/api/user/premium", {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            onPremiumSuccess(data.user);
          }
        }
      } catch (err) {
        console.error("Payment registration failed", err);
      } finally {
        setIsProcessingPayment(false);
      }
    }, 2000);
  };

  const seedSampleCandidates = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed/resumes", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      if (res.ok) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!currentUser?.isPremium) {
    return (
      <div id="hr-premium-paywall" className="max-w-4xl mx-auto space-y-8 py-4">
        {/* Pitch section */}
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full font-mono uppercase tracking-widest">
            Corporate HR Recruitment License
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight font-display">
            <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">Unlock Advanced Pipeline Rankings & Analytics</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Go beyond simple scores. Tap into smart cohort rankings, candidate skill frequency matching, predicted salary indexes, and real-time candidate search tools.
          </p>
        </div>

        {/* Feature list & payment split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Feature List */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Premium Recruiting Suite Included:</h3>
            
            <div className="space-y-4">
              {[
                { title: "Advanced Match Rankings", desc: "Instantly sort candidate pipelines using custom mathematical skill alignment algorithms." },
                { title: "Skill Gap Visualizer", desc: "Compare technical strengths against your optimal corporate technical profiles." },
                { title: "Salary Estimator Index", desc: "Gain market salary predictions calculated against the experience and certifications matching local markets." },
                { title: "Full Candidate Sourcing Details", desc: "View individual custom interview prep logs, extracted resume timelines, and certification assessments." }
              ].map((f, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="p-1 rounded bg-teal-500/10 text-teal-400 shrink-0 h-fit">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{f.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-slate-800" />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Recruiter Subscription</span>
                <span className="text-2xl font-black text-slate-100">$29<span className="text-xs text-slate-500 font-medium">/month</span></span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono uppercase">
                Cancel Anytime
              </span>
            </div>
          </div>

          {/* Simulated Stripe Checkout Form */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-teal-400" />
              Secure Checkout Portal
            </h3>

            {/* Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-850">
              <button 
                id="select-card-pm"
                onClick={() => setSelectedPaymentMethod('card')}
                className={`py-1.5 text-xs font-bold rounded-md transition ${selectedPaymentMethod === 'card' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Credit Card
              </button>
              <button 
                id="select-paypal-pm"
                onClick={() => setSelectedPaymentMethod('paypal')}
                className={`py-1.5 text-xs font-bold rounded-md transition ${selectedPaymentMethod === 'paypal' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                PayPal Checkout
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {selectedPaymentMethod === 'card' ? (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cardholder Name</label>
                    <input 
                      id="card-name-input"
                      type="text" 
                      required
                      placeholder="e.g. Recruiter Lead"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                    <div className="relative">
                      <input 
                        id="card-number-input"
                        type="text" 
                        required
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3.5 pr-10 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-mono"
                      />
                      <CreditCard className="h-4 w-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiration (MM/YY)</label>
                      <input 
                        id="card-expiry-input"
                        type="text" 
                        required
                        placeholder="12/28"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">CVV Code</label>
                      <input 
                        id="card-cvv-input"
                        type="password" 
                        required
                        maxLength={4}
                        placeholder="•••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 text-center space-y-2">
                  <span className="text-xs text-teal-400 font-bold">PayPal Sandbox Integration</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Clicking the upgrade button below will open a secure standard PayPal billing window to authenticate your active transaction.
                  </p>
                </div>
              )}

              <button
                id="submit-premium-payment"
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Processing with Stripe/PayPal...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Activate HR License Now
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="hr-dashboard-analytics" className="space-y-6">
      {/* Top dashboard summary stats cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2 font-display tracking-tight">
            <Trophy className="h-6 w-6 text-amber-400" />
            <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">Corporate HR Talent Pipeline</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Access ranking matrix, technical skill gap analysis, and calculated developer market predictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="seed-candidates-btn"
            onClick={seedSampleCandidates}
            disabled={isSeeding}
            className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 font-semibold border border-teal-500/20 rounded-xl transition flex items-center gap-1.5"
          >
            {isSeeding ? "Seeding..." : "Seed Preloaded Candidates"}
          </button>
          <button 
            id="refresh-analytics-btn"
            onClick={fetchAnalytics}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh statistics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && !analytics ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Top Row Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Analyzed Resumes</span>
                <Users className="h-5 w-5 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{analytics?.totalAnalyzed || 0}</div>
              <span className="text-[10px] text-slate-500 font-medium block">Total unique resumes processed</span>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Average ATS Index</span>
                <BarChart3 className="h-5 w-5 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{analytics?.averageAtsScore || 0}%</div>
              <span className="text-[10px] text-slate-500 font-medium block">Aggregate ATS compatibility rate</span>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Strong Candidates</span>
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{analytics?.highValueCandidates || 0}</div>
              <span className="text-[10px] text-slate-500 font-medium block">Resumes with score &gt;= 80%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Candidate Rankings & AI Insights Checklist */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  Matriculated Candidate Rankings
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400">
                        <th className="py-2.5 font-bold uppercase tracking-wider">Candidate Name</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-center">ATS Score</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-center">Callback %</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-right">Overall Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics && analytics.rankings.length > 0 ? (
                        analytics.rankings.map((r, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => setSelectedCandidateId(r.resumeId)}
                            className={`border-b border-slate-850 hover:bg-slate-900/20 text-slate-300 font-medium cursor-pointer transition duration-150 ${
                              selectedCandidateId === r.resumeId 
                                ? "bg-teal-500/5 border-l-2 border-l-teal-400" 
                                : ""
                            }`}
                          >
                            <td className="py-3 pr-2 font-semibold text-slate-100 flex items-center gap-2">
                              <span className="h-5 w-5 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold font-mono text-[10px]">
                                {idx + 1}
                              </span>
                              {r.candidateName}
                            </td>
                            <td className="py-3 text-center text-teal-400 font-mono font-bold">{r.skillsScore}%</td>
                            <td className="py-3 text-center text-emerald-400 font-mono font-bold">{r.predictedShortlistChance}%</td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 bg-slate-950 rounded text-slate-200 border border-slate-800 font-bold font-mono">
                                {r.overallScore} pts
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                            No processed candidate profiles found. Feed resumes on the analyzer tab or click "Seed Preloaded Candidates" above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Insights & Interview Checklist Panel */}
              {selectedCandidate && (
                <AIInsightsPanel candidate={selectedCandidate} />
              )}
            </div>

            {/* Skill gaps and salary */}
            <div className="lg:col-span-5 space-y-6">
              {/* Selected Candidate Radar Chart */}
              {selectedCandidate && (
                <RadarChart
                  candidateName={selectedCandidate.candidateName}
                  skillsScore={selectedCandidate.skillsScore}
                  experienceScore={selectedCandidate.experienceScore}
                  formattingScore={selectedCandidate.formattingScore}
                  atsScore={selectedCandidate.atsScore}
                  predictedShortlistChance={selectedCandidate.predictedShortlistChance}
                />
              )}

              {/* Google Calendar Interview Scheduler */}
              {selectedCandidate && (
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Google Calendar Interview Scheduler
                    </h3>
                    {!googleNeedsAuth && (
                      <button
                        onClick={handleGoogleSignOut}
                        className="text-[10px] text-rose-400 hover:text-rose-300 transition underline font-mono cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>

                  {scheduleStatus && (
                    <div className={`p-3 rounded-lg border text-xs font-medium leading-relaxed ${
                      scheduleStatus.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {scheduleStatus.message}
                    </div>
                  )}

                  {googleNeedsAuth ? (
                    <div className="space-y-3 py-2 text-center">
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Connect with your Google Workspace Account to schedule interviews directly from this candidate dashboard and sync them instantly to Google Calendar with automatic video links.
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full max-w-xs mx-auto py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow hover:shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                      >
                        {isGoogleLoading ? (
                          <div className="h-4 w-4 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin"></div>
                        ) : (
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#EA4335" d="M20,12.5C20,11.3 19.9,10.1 19.7,9H12v6.7h4.4c-0.2,1.2 -0.9,2.2 -1.9,2.8v2.3h3.1C19.4,19 20,16 20,12.5z" />
                            <path fill="#4285F4" d="M12,20c2.2,0 4,-0.7 5.3,-2l-3.1,-2.3c-0.9,0.6 -2,1 -3.2,1c-2.4,0 -4.5,-1.6 -5.2,-3.9H2.6v2.4C4,18 7.7,20 12,20z" />
                            <path fill="#FBBC05" d="M6.8,12.8c-0.2,-0.6 -0.3,-1.3 -0.3,-2c0,-0.7 0.1,-1.4 0.3,-2V6.4H2.6C1.7,8.1 1.2,10 1.2,12c0,2 0.5,3.9 1.4,5.6L6.8,12.8z" />
                            <path fill="#34A853" d="M12,7.2c1.2,0 2.3,0.4 3.1,1.2l2.3,-2.3C16,4.9 14.1,4 12,4C7.7,4 4,6 2.6,8.8l4.2,3.2C7.5,9.7 9.6,7.2 12,7.2z" />
                          </svg>
                        )}
                        <span>{isGoogleLoading ? "Connecting..." : "Enable Google Calendar Integration"}</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleScheduleInterview} className="space-y-3 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-400 font-mono bg-teal-500/5 border border-teal-500/10 rounded-lg px-2.5 py-1.5 w-fit">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Syncing as: {googleUser?.email}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Title</label>
                        <input
                          type="text"
                          required
                          value={interviewTitle}
                          onChange={(e) => setInterviewTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interviewer Email</label>
                          <input
                            type="email"
                            required
                            value={interviewerEmail}
                            onChange={(e) => setInterviewerEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Email</label>
                          <input
                            type="email"
                            required
                            value={candidateEmail}
                            onChange={(e) => setCandidateEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={interviewDateTime}
                            onChange={(e) => setInterviewDateTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium text-slate-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
                          <div className="relative">
                            <select
                              value={interviewDuration}
                              onChange={(e) => setInterviewDuration(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium appearance-none"
                            >
                              <option value={30}>30 Minutes</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                              <option value={90}>90 Minutes</option>
                            </select>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Details / Notes</label>
                        <textarea
                          rows={2}
                          value={interviewDesc}
                          onChange={(e) => setInterviewDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          id="include-meet-checkbox"
                          type="checkbox"
                          checked={includeMeet}
                          onChange={(e) => setIncludeMeet(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-teal-500"
                        />
                        <label htmlFor="include-meet-checkbox" className="text-xs text-slate-300 font-medium flex items-center gap-1 cursor-pointer">
                          <Video className="h-3.5 w-3.5 text-teal-400" />
                          Auto-generate Google Meet video call link
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isScheduling}
                        className="w-full py-2.5 px-4 mt-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-40 cursor-pointer"
                      >
                        {isScheduling ? (
                          <>
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-950/20 border-t-slate-950 animate-spin"></div>
                            <span>Scheduling and Syncing...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>Schedule & Sync with Google Calendar</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Active Scheduled Interviews list for the Candidate */}
              {selectedCandidate && (
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-850 pb-3">
                    <Clock className="h-4 w-4" />
                    Scheduled Interviews ({interviews.filter(item => item.resumeId === selectedCandidate.resumeId).length})
                  </h3>

                  <div className="space-y-3">
                    {isInterviewsLoading ? (
                      <div className="py-6 text-center text-slate-500 text-xs">Loading scheduled calendar events...</div>
                    ) : interviews.filter(item => item.resumeId === selectedCandidate.resumeId).length > 0 ? (
                      interviews.filter(item => item.resumeId === selectedCandidate.resumeId).map((item, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/85 space-y-2.5 relative group hover:border-slate-800 transition">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-teal-400 animate-pulse" />
                                {new Date(item.dateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                <span className="text-slate-600 font-mono">({item.durationMinutes}m)</span>
                              </p>
                            </div>
                            <button
                              onClick={() => handleCancelInterview(item.id, item.googleEventId)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/5 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Cancel & Delete Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {item.description && (
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-950/40 p-2 rounded border border-slate-900/60 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                            {item.candidateEmail && (
                              <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                                <Mail className="h-3 w-3 text-slate-500" />
                                Candidate: {item.candidateEmail}
                              </span>
                            )}
                          </div>

                          {item.meetLink && (
                            <div className="pt-1.5">
                              <a
                                href={item.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
                              >
                                <Video className="h-3.5 w-3.5" />
                                Join Google Meet Call
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs font-medium">
                        No active interviews scheduled for this candidate yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skill gap comparisons */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  Target Skill Gap Analysis
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Frequency of technical skills detected across candidate resumes compared to your target hiring threshold:
                </p>

                <div className="space-y-3 pt-2">
                  {analytics && analytics.skillGaps.length > 0 ? (
                    analytics.skillGaps.map((sg, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-semibold">{sg.skill}</span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {sg.frequencyInResumes}% vs {sg.requiredFrequency}% target
                          </span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850 relative">
                          <div 
                            className="h-full bg-teal-500/20 absolute left-0 top-0"
                            style={{ width: `${sg.requiredFrequency}%` }}
                          ></div>
                          <div 
                            className="h-full bg-teal-400 rounded-full absolute left-0 top-0"
                            style={{ width: `${sg.frequencyInResumes}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs font-medium">
                      Gather skill matrices as you analyze candidates.
                    </div>
                  )}
                </div>
              </div>

              {/* Salary Prediction Factors */}
              {analytics && analytics.salaryPrediction && (
                <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/10 p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      Calculated Developer Base Salary Prediction
                    </h3>
                  </div>

                  <div className="text-2xl font-black text-slate-100 font-mono">
                    {analytics.salaryPrediction.suggestedRange}
                  </div>

                  <ul className="space-y-2 mt-2">
                    {analytics.salaryPrediction.factors.map((f, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2 font-medium leading-relaxed">
                        <span className="text-emerald-400 font-bold font-mono shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
