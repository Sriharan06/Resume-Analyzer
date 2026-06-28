import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowUpRight,
  Linkedin,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { JobListing, ResumeAnalysis, User } from "../types";

interface JobsTabProps {
  lastAnalysis: ResumeAnalysis | null;
  currentUser: User | null;
  token: string | null;
  onUserUpdate?: (user: User) => void;
}

interface PersonalizedJobListing extends JobListing {
  matchScore?: number;
  personalizedReason?: string;
}

export default function JobsTab({ lastAnalysis, currentUser, token, onUserUpdate }: JobsTabProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [personalizedJobs, setPersonalizedJobs] = useState<PersonalizedJobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersonalizedLoading, setIsPersonalizedLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState("");
  
  // Tab within jobs: 'all' or 'personalized'
  const [jobsViewMode, setJobsViewMode] = useState<'all' | 'personalized'>('all');
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch standard jobs list
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedType && selectedType !== "All") params.append("type", selectedType);
      if (selectedSkill) params.append("skill", selectedSkill);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Error fetching jobs", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch personalized LinkedIn jobs list
  const fetchPersonalizedJobs = async () => {
    if (!currentUser?.linkedInConnected) return;
    setIsPersonalizedLoading(true);
    try {
      const res = await fetch("/api/jobs/personalized", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalizedJobs(data);
      }
    } catch (err) {
      console.error("Error fetching personalized job matches:", err);
    } finally {
      setIsPersonalizedLoading(false);
    }
  };

  // Watch for changes in standard search filters
  useEffect(() => {
    if (jobsViewMode === 'all') {
      fetchJobs();
    }
  }, [searchTerm, selectedType, selectedSkill, jobsViewMode]);

  // Load personalized jobs when switching mode or when LinkedIn connects
  useEffect(() => {
    if (jobsViewMode === 'personalized' && currentUser?.linkedInConnected) {
      fetchPersonalizedJobs();
    }
  }, [jobsViewMode, currentUser?.linkedInConnected]);

  // OAuth pop-up connector
  const handleConnectLinkedIn = async () => {
    if (!currentUser) return;
    setIsConnectingLinkedIn(true);
    try {
      const response = await fetch(`/api/auth/linkedin/url?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error("Failed to retrieve LinkedIn Auth Url");
      }
      const { url } = await response.json();

      // Open the provider authorization URL directly in popup
      const authWindow = window.open(
        url,
        "linkedin_oauth_popup",
        "width=620,height=720,status=no,resizable=yes"
      );

      if (!authWindow) {
        alert("Pop-up blocked. Please enable pop-ups for this site to complete LinkedIn sync.");
      }
    } catch (error) {
      console.error("LinkedIn OAuth URL construction error:", error);
    } finally {
      setIsConnectingLinkedIn(false);
    }
  };

  // Listen for callback postMessage
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      // Allow preview domains or localhost
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        // Re-fetch current user profile to update connected state
        try {
          // Since the server database is updated, we fetch our profile to sync State
          const res = await fetch("/api/hr/analytics", { // Using authorized endpoint to get fresh db users/profile or simple get-profile
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          // Wait, let's create a dedicated profile-fetch endpoint, or since our login token represents the User ID,
          // we can fetch user profile via a dedicated api call or simply re-authenticate/fetch user.
          // Let's call /api/jobs/personalized to see if it succeeds, or trigger a custom user fetch if needed.
          // Let's create an elegant /api/user/me endpoint or use /api/auth/login with simulated refresh!
          // Actually, we can simply fetch the current connected user's details. Let's do a simple GET /api/user/me in server.ts as well!
          // But first, let's see how we can fetch the user. We can do a fetch for /api/user/me.
          const userRes = await fetch("/api/user/me", {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            }
          });
          if (userRes.ok) {
            const data = await userRes.json();
            if (onUserUpdate) {
              onUserUpdate(data.user);
            }
            setJobsViewMode('personalized');
          }
        } catch (err) {
          console.error("Error syncing profile details:", err);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [token, onUserUpdate]);

  // Disconnect LinkedIn
  const handleDisconnectLinkedIn = async () => {
    if (!currentUser) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/linkedin/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (onUserUpdate) {
          onUserUpdate(data.user);
        }
        setJobsViewMode('all');
      }
    } catch (err) {
      console.error("Error disconnecting LinkedIn:", err);
    } finally {
      setDisconnecting(false);
    }
  };

  const matchScore = (jobSkills: string[]) => {
    if (!lastAnalysis) return null;
    const detected = lastAnalysis.skillsDetected.map(s => s.toLowerCase());
    const matched = jobSkills.filter(s => detected.includes(s.toLowerCase()));
    const pct = Math.round((matched.length / Math.max(jobSkills.length, 1)) * 100);
    return { pct, matchedCount: matched.length, totalCount: jobSkills.length };
  };

  return (
    <div id="jobs-tab" className="space-y-6">
      
      {/* LinkedIn OAuth Connection & Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {currentUser?.linkedInConnected && currentUser.linkedInProfile ? (
          /* Profile Connected State Dashboard */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20 shrink-0 shadow-lg shadow-blue-500/5">
                <Linkedin className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{currentUser.linkedInProfile.name}</h3>
                  <span className="px-2.5 py-0.5 text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold font-mono uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">{currentUser.linkedInProfile.headline}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {currentUser.linkedInProfile.location}
                  </span>
                  <span>•</span>
                  <span>{currentUser.linkedInProfile.industry}</span>
                </div>
                {/* Synced professional skills */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {currentUser.linkedInProfile.skills.map((sk, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-slate-400 border border-slate-800 rounded font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              id="linkedin-disconnect-btn"
              disabled={disconnecting}
              onClick={handleDisconnectLinkedIn}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100 font-bold text-xs rounded-xl border border-slate-800 transition flex items-center gap-1.5 self-start md:self-center disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect Sync"}
            </button>
          </div>
        ) : (
          /* Promotion Card for connection */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
                  <Linkedin className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  LinkedIn Profile Synced Matcher
                  <span className="px-2 py-0.5 text-[9px] bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-mono font-black uppercase rounded">
                    Advanced AI
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Connect your LinkedIn professional profile via secure OAuth to fetch personalized top-tier job board recommendations. Gemini analyzes your professional headline, history, and key credentials to unlock high-paying career affinities.
              </p>
            </div>

            <button
              id="linkedin-connect-btn"
              disabled={isConnectingLinkedIn}
              onClick={handleConnectLinkedIn}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 self-start md:self-center shadow-lg shadow-blue-500/10 disabled:opacity-50"
            >
              {isConnectingLinkedIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Linkedin className="h-4.5 w-4.5 shrink-0" />
                  Connect with LinkedIn
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Jobs Workspace Panel */}
      <div className="space-y-4">
        {/* Toggle headers */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex gap-2">
            <button
              id="jobs-view-all-btn"
              onClick={() => setJobsViewMode('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 ${
                jobsViewMode === 'all'
                  ? 'bg-slate-900 text-teal-400 border-slate-800'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              All Verified Postings
            </button>

            {currentUser?.linkedInConnected && (
              <button
                id="jobs-view-personalized-btn"
                onClick={() => setJobsViewMode('personalized')}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 relative overflow-hidden ${
                  jobsViewMode === 'personalized'
                    ? 'bg-slate-900 text-teal-400 border-slate-800'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Personalized AI Recommendations
              </button>
            )}
          </div>

          <span className="text-[10px] text-slate-500 font-mono font-semibold">
            {jobsViewMode === 'all' ? `${jobs.length} open positions` : currentUser?.linkedInConnected ? `${personalizedJobs.length} AI matches` : ""}
          </span>
        </div>

        {/* Views content */}
        {jobsViewMode === 'all' ? (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              {/* Filter controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-5 relative">
                  <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    id="job-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search roles, companies, or locations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    id="job-type-filter"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-teal-500 transition appearance-none cursor-pointer"
                  >
                    <option value="All">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex items-center gap-2">
                  <input 
                    id="job-skill-filter"
                    type="text"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    placeholder="Filter by core skill (e.g. React)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-teal-500 transition"
                  />
                  {lastAnalysis && lastAnalysis.skillsDetected.length > 0 && (
                    <button
                      id="job-autofill-btn"
                      onClick={() => setSelectedSkill(lastAnalysis.skillsDetected[0] || "")}
                      className="shrink-0 p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                      title="Autofill with your primary skill"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Auto-Filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/10 rounded-2xl border border-slate-850">
                <Briefcase className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Match Openings Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Adjust your keyword filters or clear the search query to view all available listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const match = matchScore(job.skillsRequired);
                  return (
                    <div 
                      key={job.id} 
                      className="bg-slate-900/40 hover:bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 font-mono">
                              {job.company}
                            </span>
                            <h3 className="text-base font-bold text-slate-100 mt-0.5">{job.title}</h3>
                          </div>
                          <span className="text-[10px] bg-slate-950 px-2 py-1 rounded-md text-slate-400 border border-slate-800 font-medium font-mono shrink-0">
                            {job.jobType}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-medium font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                            {job.salaryRange}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {job.skillsRequired.map((skill, idx) => {
                            const isMatched = lastAnalysis?.skillsDetected.some(
                              (s) => s.toLowerCase() === skill.toLowerCase()
                            );
                            return (
                              <span 
                                key={idx} 
                                className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                                  isMatched 
                                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' 
                                    : 'bg-slate-950 text-slate-400 border border-slate-850'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-800/50">
                        {match ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-24 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                                style={{ width: `${match.pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {match.pct}% Fit
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">Verify fit with resume analysis</span>
                        )}

                        <a 
                          id={`apply-btn-${job.id}`}
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0 shadow shadow-teal-900/10"
                        >
                          Apply Now <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Personalized Matches View */
          <div className="space-y-4">
            <div className="bg-slate-900/40 p-4.5 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Sparkles className="h-4.5 w-4.5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">AI Profile-Aligned Matches</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-0.5">
                  These recommendations are dynamically computed by matching your connected LinkedIn credentials, skills, and industry segment against active market openings.
                </p>
              </div>
            </div>

            {isPersonalizedLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-2 border-teal-500/15 border-t-teal-400 animate-spin" />
                  <Linkedin className="h-4 w-4 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-xs font-medium text-slate-400">Consulting Gemini talent model & job registry...</p>
              </div>
            ) : personalizedJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/10 rounded-2xl border border-slate-850">
                <AlertCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Personalized Recommendations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Ensure your LinkedIn account is connected or try re-connecting to refresh profile skills.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {personalizedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="relative overflow-hidden bg-slate-900/40 hover:bg-slate-900/60 p-5 rounded-2xl border border-slate-800/85 transition flex flex-col justify-between space-y-4 group"
                  >
                    {/* Tiny glowing border on hover */}
                    <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-teal-500 to-emerald-500 opacity-80" />
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 font-mono">
                            {job.company}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                            {job.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-slate-950 px-2 py-1 rounded-md text-slate-400 border border-slate-850 font-medium font-mono">
                            {job.jobType}
                          </span>
                          <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded-md font-mono font-bold">
                            {job.matchScore || 90}% AI Match
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-medium font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                          {job.salaryRange}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">Source: {job.source}</span>
                      </div>

                      {/* Customized AI explanation reason */}
                      {job.personalizedReason && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-850 border-dashed">
                          {job.personalizedReason}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skillsRequired.map((skill, idx) => {
                          const isMatched = currentUser?.linkedInProfile?.skills.some(
                            (s) => s.toLowerCase() === skill.toLowerCase()
                          );
                          return (
                            <span 
                              key={idx} 
                              className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                                isMatched 
                                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25' 
                                  : 'bg-slate-950 text-slate-500 border border-slate-850'
                              }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-slate-850">
                      <span className="text-[10px] text-slate-500 font-medium font-mono">
                        Profile aligned with connected credentials
                      </span>
                      <a 
                        id={`apply-btn-${job.id}`}
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 shadow shadow-teal-900/15"
                      >
                        Apply Now <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

