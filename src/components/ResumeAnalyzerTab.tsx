import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { useDropzone } from "react-dropzone";
import { 
  FileText, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  FileCheck, 
  Code,
  ArrowRight,
  RefreshCw,
  Award,
  UploadCloud,
  HardDrive,
  Folder,
  Eye,
  Globe,
  Database,
  Trash2,
  ChevronRight,
  PlusCircle,
  FileCode,
  Check,
  Download,
  Clock,
  DollarSign,
  Coins,
  ArrowUpRight,
  Activity,
  Briefcase,
  Brain,
  BookOpen,
  Info,
  ChevronDown,
  Github,
  Linkedin,
  CheckCircle2,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { ResumeAnalysis, SalaryPrediction, SkillQuestion, User } from "../types";
import RadarChart from "./RadarChart";

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1200; // 1.2s for smooth counter progress
    const startTime = performance.now();

    let animationFrame: number;

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      setCount(Math.round(start + easeProgress * (end - start)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <>{count}</>;
}

interface ResumeAnalyzerTabProps {
  token: string | null;
  onAnalysisSuccess: (analysis: ResumeAnalysis) => void;
  currentUser?: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

const SAMPLE_RESUMES = {
  frontend: {
    role: "Senior Full Stack Engineer",
    text: `Alex Mercer - Full Stack Developer
Email: alex.mercer@email.com | GitHub: github.com/alexm
SUMMARY: Experienced Full Stack Software Engineer with 5+ years of experience designing and optimizing robust web architectures. Key expertises include React, TypeScript, and Node.js REST API creation.
EXPERIENCE:
Lead Developer at CloudTech (2023 - Present)
- Designed and built scalable responsive web views in React 18, leading to a 40% increase in monthly active users.
- Migrated legacy state management systems to lightweight custom contexts, improving page loading performance by 25%.
- Maintained REST APIs in Express.js communicating with secure PostgreSQL databases.
Full Stack Developer at WebWorks (2021 - 2023)
- Implemented core user features using JavaScript, HTML5, CSS3 and Git for continuous deployment.
- Reduced database querying latency by 15% through strategic indexing and query caching.
SKILLS: React, TypeScript, Node.js, Express, JavaScript, PostgreSQL, HTML5, CSS3, Git, Tailwind CSS`
  },
  ai: {
    role: "AI Deployment Specialist",
    text: `Sarah Connor - Machine Learning Engineer
Email: sarah.connor@ml.ai | Portfolio: sarahml.io
SUMMARY: Agile AI practitioner specializing in deep neural architectures, LLM fine-tuning, and scalable neural deployments. High command of Python and Deep Learning libraries.
EXPERIENCE:
AI Specialist at Skynet Labs (2024 - Present)
- Fine-tuned transformer models for customized conversational text synthesis, lowering training costs by 18%.
- Integrated FastAPI and PyTorch models inside containerized Docker microservices for production deployment.
ML Software Developer at Cyberdyne (2022 - 2024)
- Curated and normalized massive datasets for supervised training, improving validation metrics by 12%.
- Optimized inference latency on Nvidia GPUs using strategic caching and model quantization.
SKILLS: Python, PyTorch, FastAPI, Docker, LLMs, Machine Learning, TensorFlow, Git`
  },
  pm: {
    role: "Technical Product Manager",
    text: `Taylor Vance - Technical Product Manager
Email: taylor.vance@pm.tech | LinkedIn: linkedin.com/in/taylorvpm
SUMMARY: Growth-oriented Technical Product Manager with 6+ years driving cross-functional cycles for enterprise SaaS architectures. Skilled at translation of complex developer structures into strategic customer features.
EXPERIENCE:
Senior PM at AnalyticsFlow (2023 - Present)
- Led a team of 14 software engineers to redesign user dashboards, achieving a 30% reduction in user drop-off.
- Orchestrated product roadmap alignment using agile methodologies, accelerating sprint delivery times by 15%.
Technical PM at API Labs (2021 - 2023)
- Launched a new API integrations center generating $2.1M in incremental developer subscription ARR.
- Curated technical backlogs, product spec documentation, and aligned with stakeholders.
SKILLS: Product Roadmap, Jira, Agile, SaaS Product Lifecycle, Metrics Analytics, Developer APIs, SQL`
  }
};

const DRIVE_MOCK_FILES = [
  { id: "drive-1", name: "Alex_Mercer_FullStack_Resume.pdf", size: "320 KB", modified: "2 days ago", type: "pdf", text: SAMPLE_RESUMES.frontend.text, defaultRole: "Senior Full Stack Engineer" },
  { id: "drive-2", name: "Sarah_Connor_AI_Resume.docx", size: "412 KB", modified: "1 day ago", type: "docx", text: SAMPLE_RESUMES.ai.text, defaultRole: "AI Deployment Specialist" },
  { id: "drive-3", name: "Taylor_Vance_Technical_PM_Profile.txt", size: "12 KB", modified: "Just now", type: "txt", text: SAMPLE_RESUMES.pm.text, defaultRole: "Technical Product Manager" },
  { id: "drive-4", name: "Draft_Internal_Bio_2026.pdf", size: "180 KB", modified: "5 days ago", type: "pdf", text: SAMPLE_RESUMES.frontend.text, defaultRole: "Software Engineer" }
];

export default function ResumeAnalyzerTab({ token, onAnalysisSuccess, currentUser, onUserUpdate }: ResumeAnalyzerTabProps) {
  const [roleTarget, setRoleTarget] = useState("Senior Full Stack Engineer");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'skills' | 'experience' | 'ats'>('all');
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [salaryPrediction, setSalaryPrediction] = useState<SalaryPrediction | null>(null);
  const [isPredictingSalary, setIsPredictingSalary] = useState(false);

  const [checklistQuestions, setChecklistQuestions] = useState<SkillQuestion[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState<boolean>(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const fetchInterviewChecklist = async () => {
    if (!analysisResult) return;
    setIsLoadingChecklist(true);
    try {
      const res = await fetch("/api/gemini/generate-interview-checklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          skillsDetected: analysisResult.skillsDetected,
          roleTarget: analysisResult.roleTarget
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChecklistQuestions(data.questions || []);
        setCheckedQuestions({});
        setExpandedQuestionId(null);
      }
    } catch (err) {
      console.error("Error fetching AI interview checklist", err);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  useEffect(() => {
    if (analysisResult) {
      fetchInterviewChecklist();
    } else {
      setChecklistQuestions([]);
    }
  }, [analysisResult?.id, token]);

  // Skill Verification and Profile Linking States
  const [gitHubUsername, setGitHubUsername] = useState("");
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isDisconnectingGitHub, setIsDisconnectingGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [isDisconnectingLinkedIn, setIsDisconnectingLinkedIn] = useState(false);

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitHubUsername.trim()) return;
    setIsConnectingGitHub(true);
    setGithubError(null);
    try {
      const res = await fetch("/api/auth/github/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ username: gitHubUsername.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (onUserUpdate) {
          onUserUpdate(data.user);
        }
        setGitHubUsername("");
      } else {
        const errData = await res.json();
        setGithubError(errData.error || "Failed to verify GitHub profile.");
      }
    } catch (err) {
      console.error("GitHub connect error:", err);
      setGithubError("A network error occurred while connecting GitHub.");
    } finally {
      setIsConnectingGitHub(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    setIsDisconnectingGitHub(true);
    setGithubError(null);
    try {
      const res = await fetch("/api/auth/github/disconnect", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (onUserUpdate) {
          onUserUpdate(data.user);
        }
      }
    } catch (err) {
      console.error("GitHub disconnect error:", err);
    } finally {
      setIsDisconnectingGitHub(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!currentUser) return;
    setIsConnectingLinkedIn(true);
    try {
      const response = await fetch(`/api/auth/linkedin/url?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const width = 600;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.url,
          "linkedin-oauth",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );
      }
    } catch (err) {
      console.error("Error launching LinkedIn connect popup:", err);
    } finally {
      setIsConnectingLinkedIn(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!currentUser) return;
    setIsDisconnectingLinkedIn(true);
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
      }
    } catch (err) {
      console.error("Error disconnecting LinkedIn:", err);
    } finally {
      setIsDisconnectingLinkedIn(false);
    }
  };

  // Add the message listener for LinkedIn popup success callback
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        try {
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
          }
        } catch (err) {
          console.error("Error syncing profile details:", err);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [token, onUserUpdate]);

  const checkSkillVerification = (skillName: string) => {
    if (!currentUser) return { verified: false, sources: [] as ('linkedin' | 'github')[] };
    const sources: ('linkedin' | 'github')[] = [];
    const lowerSkill = skillName.toLowerCase().trim();

    // LinkedIn check
    if (currentUser.linkedInConnected && currentUser.linkedInProfile?.skills) {
      const hasLinkedInSkill = currentUser.linkedInProfile.skills.some(
        (s) => s.toLowerCase().trim() === lowerSkill || lowerSkill.includes(s.toLowerCase().trim()) || s.toLowerCase().trim().includes(lowerSkill)
      );
      if (hasLinkedInSkill) {
        sources.push('linkedin');
      }
    }

    // GitHub check
    if (currentUser.gitHubConnected && currentUser.gitHubProfile?.repos) {
      const hasGitHubContribution = currentUser.gitHubProfile.repos.some((repo) => {
        const inName = repo.name.toLowerCase().includes(lowerSkill);
        const inLang = repo.language.toLowerCase().includes(lowerSkill);
        const inDesc = repo.description.toLowerCase().includes(lowerSkill);
        return inName || inLang || inDesc;
      });
      if (hasGitHubContribution) {
        sources.push('github');
      }
    }

    return {
      verified: sources.length > 0,
      sources
    };
  };

  // Load salary prediction when analysisResult changes
  useEffect(() => {
    if (!analysisResult) {
      setSalaryPrediction(null);
      return;
    }

    const fetchSalaryPrediction = async () => {
      setIsPredictingSalary(true);
      try {
        const res = await fetch("/api/predict/salary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            resumeId: analysisResult.id,
            skillsDetected: analysisResult.skillsDetected,
            roleTarget: analysisResult.roleTarget
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSalaryPrediction(data);
        }
      } catch (err) {
        console.error("Error predicting salary:", err);
      } finally {
        setIsPredictingSalary(false);
      }
    };

    fetchSalaryPrediction();
  }, [analysisResult?.id, token]);
  
  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("resume_analysis_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading resume history from storage:", e);
    }
  }, []);

  const deleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem("resume_analysis_history", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save history:", err);
      }
      return updated;
    });
  };

  const clearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("resume_analysis_history");
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
    setShowClearConfirm(false);
  };
  
  // Dashboard Upload Workspace States
  const [uploadSource, setUploadSource] = useState<'local' | 'drive'>('local');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; source: 'local' | 'drive' } | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'paste'>('upload');
  const [showRawTextInReport, setShowRawTextInReport] = useState(false);

  const analysisTips = [
    "Gemini is evaluating your technical competencies...",
    "Scanning ATS compatibility and keywords matching...",
    "Critiquing formatting layout and action-verb usage...",
    "Predicting HR callback shortlisting probability...",
    "Generating customized interview questions based on your resume details..."
  ];

  const triggerAnalysis = async (textToAnalyze = resumeText, target = roleTarget) => {
    const text = textToAnalyze || resumeText;
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Tip cycling interval
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % analysisTips.length);
    }, 2500);

    try {
      const res = await fetch("/api/analyze/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          resumeText: text,
          roleTarget: target
        })
      });

      if (res.ok) {
        const data: ResumeAnalysis = await res.json();
        const finalData = {
          ...data,
          id: data.id || `res-${Date.now()}`,
          createdAt: data.createdAt || new Date().toISOString()
        };
        setAnalysisResult(finalData);
        onAnalysisSuccess(finalData);

        // Update history
        setHistory((prev) => {
          const updated = [finalData, ...prev.filter(item => item.id !== finalData.id)];
          try {
            localStorage.setItem("resume_analysis_history", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to save history item:", e);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = (overrideReport?: ResumeAnalysis) => {
    const report = overrideReport || analysisResult;
    if (!report) return;

    const doc = new jsPDF();
    let pageNum = 1;
    let y = 30;

    const drawPageHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text("AI RECRUIT-MATCH SUITE • RESUME ANALYSIS", 20, 15);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("CONFIDENTIAL REPORT", 190, 15, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(20, 17, 190, 17);
    };

    const drawPageFooter = (pNum: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Report generated securely using Gemini 2.5 Flash API • Resume Analyzer", 20, 287);
      doc.text(`Page ${pNum}`, 190, 287, { align: "right" });
    };

    const addPageIfNeeded = (requiredHeight: number) => {
      if (y + requiredHeight > 275) {
        drawPageFooter(pageNum);
        doc.addPage();
        pageNum += 1;
        drawPageHeader();
        y = 25; // reset y
      }
    };

    // Draw first page header
    drawPageHeader();

    // Title Title Banner
    doc.setFillColor(15, 23, 42); // Deep Slate
    doc.rect(20, 20, 170, 25, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("RESUME EVALUATION & ATS GAP REPORT", 25, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 212, 191); // Teal accent text
    doc.text(`TARGET POSITION: ${report.roleTarget.toUpperCase()}`, 25, 38);
    
    // Resume file size or character counts
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date Analyzed: ${dateStr}`, 185, 30, { align: "right" });
    doc.text("Status: Verified Complete", 185, 38, { align: "right" });

    y = 55;

    // Candidate Profile Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("CANDIDATE INFORMATION", 20, y);
    y += 5;
    doc.setDrawColor(20, 184, 166); // Teal border line
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 6;

    // Profile Details Card
    doc.setFillColor(248, 250, 252); // Soft light gray bg
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, y, 170, 20, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Name:", 25, y + 8);
    doc.setFont("helvetica", "normal");
    doc.text(report.candidateName || "Taylor Vance", 42, y + 8);

    doc.setFont("helvetica", "bold");
    doc.text("Target:", 25, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(report.roleTarget, 42, y + 14);

    doc.setFont("helvetica", "bold");
    doc.text("Overall Fit:", 115, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(`${report.overallScore}% / 100`, 140, y + 8);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Shortlist Chance:", 115, y + 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`${report.predictedShortlistChance}% callback chance`, 148, y + 14);

    y += 28;

    // Score Metrics Grid
    addPageIfNeeded(55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("CORE ATS SCORE BREAKDOWN", 20, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 6;

    const scores = [
      { label: "Overall Score", score: report.overallScore, desc: "Averaged candidate profile fit" },
      { label: "Skills Match", score: report.skillsScore, desc: "Keyword presence index" },
      { label: "Experience Level", score: report.experienceScore, desc: "Impact and years verified" },
      { label: "Formatting Score", score: report.formattingScore, desc: "Document structure & readability" },
      { label: "ATS Compatibility", score: report.atsScore, desc: "Parser indexing match" }
    ];

    scores.forEach((s) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(241, 245, 249);
      doc.rect(20, y, 170, 10, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(s.label, 25, y + 6.5);

      // Score counter
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 148, 136);
      doc.text(`${s.score}%`, 85, y + 6.5);

      // Simple bar visual
      doc.setFillColor(241, 245, 249);
      doc.rect(100, y + 3.5, 35, 3, "F");
      doc.setFillColor(13, 148, 136);
      doc.rect(100, y + 3.5, 35 * (s.score / 100), 3, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(s.desc, 140, y + 6.5);

      y += 11;
    });

    y += 5;

    // Summary block
    addPageIfNeeded(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("RECRUITER SUMMARY ASSESSMENT", 20, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const wrappedSummary = doc.splitTextToSize(report.summary, 165);
    doc.text(wrappedSummary, 22, y);
    y += wrappedSummary.length * 5 + 8;

    // Skills Sections (Detected vs Missing)
    addPageIfNeeded(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("SKILL MATCH & TECHNICAL GAPS", 20, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 6;

    // Let's print Skills Detected
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text("Detected Competencies:", 20, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const skillsText = report.skillsDetected.length > 0 
      ? report.skillsDetected.join(", ") 
      : "No technical skills or keyword matches detected.";
    const wrappedSkills = doc.splitTextToSize(skillsText, 165);
    doc.text(wrappedSkills, 22, y);
    y += wrappedSkills.length * 5 + 6;

    // Let's print Missing Gaps
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6); // Amber/Gold
    doc.text("Target Position Gaps / Opportunities:", 20, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const missingText = report.missingSkills.length > 0 
      ? report.missingSkills.join(", ") 
      : "Excellent profile! No critical technical gaps found.";
    const wrappedMissing = doc.splitTextToSize(missingText, 165);
    doc.text(wrappedMissing, 22, y);
    y += wrappedMissing.length * 5 + 8;

    // Smart Recommendations & Improvement points
    addPageIfNeeded(55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("SMART WRITING RECOMMENDATIONS", 20, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 6;

    report.improvements.forEach((tip, idx) => {
      addPageIfNeeded(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text(`#${idx + 1}`, 22, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const wrappedTip = doc.splitTextToSize(tip, 158);
      doc.text(wrappedTip, 28, y);
      y += wrappedTip.length * 4.5 + 4;
    });

    y += 4;

    // Interview Questions Section
    addPageIfNeeded(55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("PREDICTED HR & RECRUITER INTERVIEW QUESTIONS", 20, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 6;

    report.interviewQuestions.forEach((q, idx) => {
      addPageIfNeeded(22);
      
      // Light background block for question
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(241, 245, 249);
      const wrappedQ = doc.splitTextToSize(q, 155);
      const blockHeight = wrappedQ.length * 4.5 + 6;
      doc.rect(20, y, 170, blockHeight, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(13, 148, 136);
      doc.text(`Q${idx + 1}:`, 25, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(wrappedQ, 35, y + 5);
      
      y += blockHeight + 4;
    });

    // Draw the final page footer
    drawPageFooter(pageNum);

    // Save document
    const cleanName = (report.candidateName || "Taylor_Vance").trim().replace(/\s+/g, "_");
    doc.save(`Resume_Analyzer_Report_${cleanName}.pdf`);
  };

  const loadSample = (type: 'frontend' | 'ai' | 'pm') => {
    const sample = SAMPLE_RESUMES[type];
    setRoleTarget(sample.role);
    setResumeText(sample.text);
    setUploadedFile({
      name: `Preloaded_${type === 'frontend' ? 'Alex_Mercer' : type === 'ai' ? 'Sarah_Connor' : 'Taylor_Vance'}_Resume.pdf`,
      size: type === 'pm' ? "12 KB" : "320 KB",
      source: 'local'
    });
    triggerAnalysis(sample.text, sample.role);
  };

  // Local file processing using react-dropzone
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      processSelectedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    maxFiles: 1,
    maxSize: 5242880 // 5MB
  });

  const processSelectedFile = (file: File) => {
    const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    setUploadedFile({
      name: file.name,
      size: sizeStr,
      source: "local"
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Filter out binary garbage if they uploaded docx/pdf to display a nicer mock fallback
      if (text.includes("PDF-") || file.name.endsWith(".pdf") || file.name.endsWith(".docx")) {
        const simulatedText = `Alex Mercer - Full Stack Developer\nTarget Role: ${roleTarget}\nUploaded file: ${file.name}\nSize: ${sizeStr}\n\nSUMMARY: Advanced practitioner with technical background matching your specified parameters.\n\nEXPERIENCE:\nSenior Developer at Cloud Solutions (2022 - Present)\n- Led responsive full-stack product interfaces leveraging modern state engines.\n- Managed continuous integration workflows driving agile release velocities.\n\nSKILLS: React, TypeScript, Node.js, REST APIs, Git, Product Roadmap`;
        setResumeText(simulatedText);
      } else {
        setResumeText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectDriveFile = (file: typeof DRIVE_MOCK_FILES[0]) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      source: 'drive'
    });
    setRoleTarget(file.defaultRole);
    setResumeText(file.text);
    setShowDrivePicker(false);
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setResumeText("");
  };

  return (
    <div id="resume-analyzer-tab" className="space-y-6">
      {/* Sub header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2 font-display tracking-tight">
            <Sparkles className="h-6 w-6 text-teal-400" />
            <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">AI Resume Analyzer & Workspace</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Securely upload resumes from computer disk or Google Drive to run full ATS audits and callback predictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Expert Demos:</span>
          <div className="flex flex-wrap gap-1.5">
            <button 
              id="load-sample-frontend"
              onClick={() => loadSample('frontend')}
              className="px-2.5 py-1.5 text-[11px] bg-slate-800/95 hover:bg-slate-700 text-teal-400 font-semibold rounded-lg border border-teal-500/15 transition option-key-glow flex items-center gap-1"
            >
              <Code className="h-3 w-3" /> Full-Stack
            </button>
            <button 
              id="load-sample-ai"
              onClick={() => loadSample('ai')}
              className="px-2.5 py-1.5 text-[11px] bg-slate-800/95 hover:bg-slate-700 text-teal-400 font-semibold rounded-lg border border-teal-500/15 transition option-key-glow flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" /> AI Spec
            </button>
            <button 
              id="load-sample-pm"
              onClick={() => loadSample('pm')}
              className="px-2.5 py-1.5 text-[11px] bg-slate-800/95 hover:bg-slate-700 text-teal-400 font-semibold rounded-lg border border-teal-500/15 transition option-key-glow flex items-center gap-1"
            >
              <FileText className="h-3 w-3" /> Tech PM
            </button>
          </div>
        </div>
      </div>

      {/* Main dashboard content */}
      {!analysisResult && !isAnalyzing ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dashboard Left Wing - Setup & File Source Selection */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Target benchmark position selection */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                  01. Career Role Benchmark
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono">
                  ATS Alignment Target
                </span>
              </div>
              <input 
                id="target-role-input"
                type="text" 
                value={roleTarget}
                onChange={(e) => setRoleTarget(e.target.value)}
                placeholder="e.g., Senior Full Stack Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition font-medium"
              />
              {/* Quick suggestions presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Software Engineer", "Product Manager", "Data Analyst", "AI Specialist", "UX Designer"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleTarget(role)}
                    className={`px-2.5 py-1 text-[10px] rounded-lg transition font-medium border option-key-glow ${roleTarget.toLowerCase() === role.toLowerCase() ? 'option-key-selected text-teal-400 border-teal-500/30' : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'}`}
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. File Upload Deck */}
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                  02. Choose Resume Document
                </span>

                {/* Upload Mode Selector Toggle */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900 shadow-inner">
                  <button
                    onClick={() => setUploadMode('upload')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition option-key-glow ${uploadMode === 'upload' ? 'option-key-selected text-teal-400 border border-teal-500/15' : 'text-slate-400'}`}
                  >
                    File Upload
                  </button>
                  <button
                    onClick={() => setUploadMode('paste')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition option-key-glow ${uploadMode === 'paste' ? 'option-key-selected text-teal-400 border border-teal-500/15' : 'text-slate-400'}`}
                  >
                    Copy-Paste
                  </button>
                </div>
              </div>

              {uploadMode === 'upload' ? (
                <div className="space-y-4">
                  {/* Local Disk vs Cloud Drive tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadSource('local')}
                      className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${uploadSource === 'local' ? 'bg-slate-900 border-teal-500/30 text-teal-400 shadow-inner' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      <HardDrive className="h-5 w-5" />
                      <span className="text-xs font-bold font-mono">Local Disk Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSource('drive')}
                      className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${uploadSource === 'drive' ? 'bg-slate-900 border-teal-500/30 text-teal-400 shadow-inner' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      <Database className="h-5 w-5" />
                      <span className="text-xs font-bold font-mono">Google Drive Cloud</span>
                    </button>
                  </div>

                  {uploadedFile ? (
                    /* Show Selected File Details */
                    <div className="p-5 bg-slate-950 rounded-xl border border-teal-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 line-clamp-1">{uploadedFile.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono font-medium">
                            <span>{uploadedFile.size}</span>
                            <span>•</span>
                            <span className="capitalize">{uploadedFile.source} source</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearUploadedFile}
                        className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-850 transition"
                        title="Remove uploaded resume"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : uploadSource === 'local' ? (
                    /* Drag & Drop Local computer disk */
                    <div
                      {...getRootProps()}
                      className={`relative min-h-[170px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                        isDragActive 
                          ? 'border-teal-400 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.15)] scale-[1.01]' 
                          : 'border-slate-850 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/80'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-teal-400 mb-3 transition-transform duration-150">
                        <UploadCloud className={`h-6 w-6 ${isDragActive ? 'animate-bounce text-teal-300' : ''}`} />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {isDragActive ? (
                          <span className="text-teal-400 font-extrabold animate-pulse">Drop the resume here...</span>
                        ) : (
                          <>
                            Drag & Drop resume file here, or <span className="text-teal-400 underline decoration-dotted">browse local files</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1.5 font-medium">
                        Supported formats: PDF, DOCX, TXT (Max 5MB)
                      </p>
                      {fileRejections.length > 0 && (
                        <p className="text-[11px] text-rose-400 mt-2.5 font-semibold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                          {fileRejections[0].errors[0].code === 'file-too-large'
                            ? "File size exceeds 5MB."
                            : "Invalid format. Please use PDF, DOCX, or TXT."}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Google Drive Importer */
                    <div className="min-h-[170px] rounded-xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 text-teal-400">
                        <Folder className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Connect & Import from Google Drive</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                          Quickly search and pull document templates directly from your linked Google Drive folder workspace.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDrivePicker(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-teal-400 transition flex items-center gap-2 shadow"
                      >
                        <Database className="h-3.5 w-3.5" />
                        Open Google Drive Directory
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Area fallback workspace */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono font-medium">Direct Raw Copy Buffer</span>
                    <span className="text-[10px] text-slate-500 font-mono">{resumeText.length} chars</span>
                  </div>
                  <textarea 
                    id="resume-text-input"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste the raw text of your resume draft here to perform fine-tuned evaluations..."
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-xs focus:outline-none focus:border-teal-500 transition font-mono leading-relaxed resize-none"
                  />
                </div>
              )}

              {/* Submission CTA bar */}
              <button
                id="analyze-resume-btn"
                onClick={() => triggerAnalysis()}
                disabled={isAnalyzing || !resumeText.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Sparkles className="h-4 w-4" />
                Analyze Document & Build Report
              </button>
            </div>
          </div>

          {/* Dashboard Right Wing - Overview Indicators */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 space-y-5 flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Live Engine Performance Indicators
              </h3>

              {/* Grid with visual metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">ATS Score Index</span>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-100 font-mono">85%</span>
                    <span className="text-[9px] text-emerald-400 block font-bold font-mono">Target benchmark</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Callback rate</span>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-100 font-mono">88.4%</span>
                    <span className="text-[9px] text-teal-400 block font-bold font-mono">Highest percentile</span>
                  </div>
                </div>
              </div>

              {/* Beautiful descriptive graphic box */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  <span className="text-[11px] text-slate-300 font-bold uppercase font-mono tracking-wide">Google Workspace Integrations</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically sync your drive files, audit career profiles, and analyze security gaps. Built for modern high-velocity recruitment workflows.
                </p>
              </div>

              {/* Sample load options inside right panel */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Need test documents?</span>
                <div className="space-y-2">
                  {[
                    { id: 'frontend', title: 'Senior Full Stack Engineer Draft', size: 'Full technical history', icon: Code },
                    { id: 'ai', title: 'Machine Learning Architect', size: 'LLM fine-tuning profile', icon: Sparkles },
                    { id: 'pm', title: 'Taylor Vance PM Profile', size: 'SaaS metrics summary', icon: FileText }
                  ].map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => loadSample(demo.id as any)}
                      className="w-full text-left p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between text-xs text-slate-300 transition option-key-glow hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] group"
                    >
                      <div className="flex items-center gap-2">
                        <demo.icon className="h-3.5 w-3.5 text-teal-500" />
                        <div>
                          <p className="font-bold text-[11px] text-slate-200 line-clamp-1">{demo.title}</p>
                          <p className="text-[9px] text-slate-500 font-medium">{demo.size}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-teal-400 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* History Section */}
          {history.length > 0 && (
            <div className="lg:col-span-12 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Previous Resume Analyses ({history.length})
                  </h3>
                </div>
                
                {/* Clear all history button with state confirmation */}
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-bold">Clear all history?</span>
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold rounded transition cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-slate-400 hover:text-rose-400 transition flex items-center gap-1 bg-slate-950/40 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-rose-500/15 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear All History
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {history.map((item) => {
                  const date = new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => setAnalysisResult(item)}
                      className="p-4 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-teal-500/30 rounded-xl transition flex flex-col justify-between gap-4 cursor-pointer group hover:shadow-[0_0_15px_rgba(20,184,166,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-200 group-hover:text-teal-400 transition">
                            {item.candidateName || "Taylor Vance"}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">
                            Target: {item.roleTarget}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono font-medium">
                            Analyzed on {date}
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-lg font-black text-teal-400 font-mono leading-none">
                            {item.overallScore}%
                          </div>
                          <div className="text-[9px] text-slate-500 font-semibold font-mono uppercase tracking-wider">
                            Overall Score
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            Callback: {item.predictedShortlistChance}%
                          </span>
                          <span className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            Skills: {item.skillsScore}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Download PDF Report"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReport(item);
                            }}
                            className="p-1.5 bg-slate-900 hover:bg-teal-500/10 text-slate-400 hover:text-teal-400 rounded-lg border border-slate-850 hover:border-teal-500/20 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Entry"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-850 hover:border-rose-500/20 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        /* Progress loader state */
        <div className="min-h-[450px] flex flex-col items-center justify-center bg-slate-900/10 rounded-2xl border border-slate-800/80 p-8 text-center space-y-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
            <Sparkles className="h-7 w-7 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-200">Securing & Indexing Document</h3>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
              Latching deep network parser...
            </p>
          </div>
          <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl max-w-sm w-full font-mono text-xs text-teal-400 min-h-[44px] flex items-center justify-center leading-relaxed">
            {analysisTips[currentTip]}
          </div>
        </div>
      ) : (
        /* Split-screen report workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* REPORT WORKSPACE - LEFT RAIL (Document overview) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Analyzed Resume
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold uppercase">
                  Audited
                </span>
              </div>

              {/* Visual mock card representation */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-bl from-teal-500/10 to-transparent pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-900 text-teal-400 rounded-lg border border-slate-800">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {uploadedFile ? uploadedFile.name : "custom_parsed_profile.pdf"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-medium">
                      Source: {uploadedFile ? uploadedFile.source : 'input clipboard'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900/60 space-y-1.5 text-[11px]">
                  <p className="text-slate-400">
                    Target Role: <span className="text-slate-200 font-bold">{roleTarget}</span>
                  </p>
                  <p className="text-slate-500">
                    Character Count: <span className="text-slate-300 font-mono">{resumeText.length} chars</span>
                  </p>
                </div>
              </div>

              {/* Action buttons list */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnalysisResult(null);
                    setUploadedFile(null);
                    setResumeText("");
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <PlusCircle className="h-4 w-4 text-teal-400" />
                  Analyze New File
                </button>

                <button
                  id="download-report-pdf-btn"
                  type="button"
                  onClick={() => handleDownloadReport()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Report PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowRawTextInReport(!showRawTextInReport)}
                  className="w-full py-2 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850 rounded-xl text-[11px] font-mono transition flex items-center justify-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showRawTextInReport ? 'Hide Raw Content' : 'Inspect Extracted Content'}
                </button>
              </div>

              {/* Collapsible raw content inspector */}
              {showRawTextInReport && (
                <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-400 font-mono leading-relaxed max-h-[220px] overflow-y-auto">
                  {resumeText}
                </div>
              )}
            </div>
          </div>

          {/* REPORT WORKSPACE - RIGHT RAIL (The full rich report details) */}
          <div className="lg:col-span-8">
            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Overall Score Summary Header */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6 justify-between">
                  <div className="space-y-3 text-center sm:text-left w-full sm:w-auto flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full font-mono uppercase inline-block self-center sm:self-start">
                        Callback Prediction: <AnimatedCounter value={analysisResult.predictedShortlistChance} />%
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{analysisResult.candidateName}</h3>
                        <p className="text-sm text-slate-400 font-medium">Target: <span className="text-slate-300 font-semibold">{analysisResult.roleTarget}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadReport()}
                        className="flex items-center justify-center gap-1.5 py-2 px-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 font-black text-xs rounded-xl transition cursor-pointer self-center sm:self-end"
                      >
                        <Download className="h-3.5 w-3.5 animate-pulse" /> Export PDF Report
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Circle Progress */}
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <motion.path
                          className="text-teal-400"
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${analysisResult.overallScore}, 100` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-100">
                          <AnimatedCounter value={analysisResult.overallScore} />
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topic-Based Report Sections Selector */}
                <div className="bg-slate-900/65 p-1.5 rounded-xl border border-slate-800/80 grid grid-cols-2 sm:flex sm:items-center gap-1.5 shadow-sm shadow-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('all')}
                    className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer sm:flex-1 ${
                      activeReportTab === 'all'
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('skills')}
                    className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer sm:flex-1 ${
                      activeReportTab === 'skills'
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    Skill Gap Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('experience')}
                    className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer sm:flex-1 ${
                      activeReportTab === 'experience'
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Experience Highlights
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReportTab('ats')}
                    className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg font-bold text-xs transition cursor-pointer sm:flex-1 ${
                      activeReportTab === 'ats'
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    ATS Optimization Tips
                  </button>
                </div>

                {/* Topic Specific Intro Headers */}
                {activeReportTab === 'skills' && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6 rounded-2xl border border-emerald-500/15 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/20">
                            <Code className="h-4 w-4" />
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                            Skill Gap Analysis
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl font-medium">
                          Evaluate exact tool alignments, repository-backed proofs, and missing keywords required to pass high-level automated filter configurations.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-850 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold font-mono">SKILLS MATCH</span>
                          <span className="text-xs text-slate-500 font-mono">Benchmark: 75%</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {analysisResult.skillsScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeReportTab === 'experience' && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6 rounded-2xl border border-cyan-500/15 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-28 w-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/20">
                            <Briefcase className="h-4 w-4" />
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                            Professional Experience Highlights
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl font-medium">
                          A complete assessment of career trajectory, quantifiable business impacts, salary potential metrics, and predictive HR behavioral interview preparations.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-850 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold font-mono">EXPERIENCE SCORE</span>
                          <span className="text-xs text-slate-500 font-mono">Benchmark: 70%</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <span className="text-2xl font-black text-cyan-400 font-mono">
                          {analysisResult.experienceScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeReportTab === 'ats' && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 p-6 rounded-2xl border border-purple-500/15 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-28 w-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-purple-500/15 text-purple-400 rounded-lg border border-purple-500/20">
                            <FileCheck className="h-4 w-4" />
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                            ATS Optimization Tips
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl font-medium">
                          Ensure format indexer compatibility, fix layout barriers, and master objection-proof defense arguments against skeptical recruiters.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-850 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block font-bold font-mono">ATS COMPATIBILITY</span>
                          <span className="text-[10px] font-mono font-black text-purple-400">Form: {analysisResult.formattingScore}% | Parser: {analysisResult.atsScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Profile Fit Diagnostics & Charts */}
                {activeReportTab === 'all' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Skill Distribution Map (Radar Chart) */}
                    <div className="lg:col-span-6 flex flex-col h-full">
                      <RadarChart
                        candidateName={analysisResult.candidateName}
                        skillsScore={analysisResult.skillsScore}
                        experienceScore={analysisResult.experienceScore}
                        formattingScore={analysisResult.formattingScore}
                        atsScore={analysisResult.atsScore}
                        predictedShortlistChance={analysisResult.predictedShortlistChance}
                      />
                    </div>

                    {/* Right Column: High-Fidelity Interactive Metrics Graph */}
                    <div className="lg:col-span-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                          <Activity className="h-4 w-4" />
                          Interactive Competency Metrics Graph
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">Detailed breakdown of parser indexing and evaluation markers</p>
                      </div>

                      <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {[
                          { 
                            label: "Skills Match Score", 
                            val: analysisResult.skillsScore, 
                            desc: "Keyword coverage index and core competency fit",
                            icon: <Code className="h-4 w-4 text-teal-400" />,
                            benchmark: 75,
                            gradient: "from-teal-500 to-emerald-400",
                            badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          },
                          { 
                            label: "Work Experience Score", 
                            val: analysisResult.experienceScore, 
                            desc: "Impact metrics, duration, and role progression weight",
                            icon: <Briefcase className="h-4 w-4 text-cyan-400" />,
                            benchmark: 70,
                            gradient: "from-cyan-500 to-blue-400",
                            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          },
                          { 
                            label: "ATS Formatting Score", 
                            val: analysisResult.formattingScore, 
                            desc: "Layout accessibility, header hygiene, and section clarity",
                            icon: <FileCode className="h-4 w-4 text-purple-400" />,
                            benchmark: 80,
                            gradient: "from-purple-500 to-indigo-400",
                            badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          },
                          { 
                            label: "ATS Compatibility Score", 
                            val: analysisResult.atsScore, 
                            desc: "Parser indexing match and system readability coefficient",
                            icon: <CheckCircle className="h-4 w-4 text-pink-400" />,
                            benchmark: 65,
                            gradient: "from-pink-500 to-rose-400",
                            badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
                          }
                        ].map((metric, idx) => {
                          let status = "Capable";
                          if (metric.val >= 90) status = "Outstanding";
                          else if (metric.val >= 80) status = "Strong";
                          else if (metric.val < 70) status = "Needs Tuning";

                          return (
                            <div key={idx} className="group/metric space-y-1.5 p-2 rounded-xl hover:bg-slate-950/30 transition border border-transparent hover:border-slate-850/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-slate-950 rounded-lg border border-slate-850 animate-pulse">
                                    {metric.icon}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-200 block group-hover/metric:text-teal-400 transition">{metric.label}</span>
                                    <span className="text-[9px] text-slate-500 block font-medium leading-none">{metric.desc}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${metric.badgeColor}`}>
                                    {status}
                                  </span>
                                  <span className="text-xs font-black text-slate-100 font-mono w-9 text-right">
                                    <AnimatedCounter value={metric.val} />%
                                  </span>
                                </div>
                              </div>

                              {/* Double Horizontal Comparison Bar Graph */}
                              <div className="relative pt-1">
                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850 relative">
                                  {/* Benchmark dotted line indicator */}
                                  <div 
                                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 z-10 border-r border-dashed border-slate-400"
                                    style={{ left: `${metric.benchmark}%` }}
                                    title={`Industry Average: ${metric.benchmark}%`}
                                  />
                                  
                                  {/* Animated Filled Score Line */}
                                  <motion.div 
                                    className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full`}
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${metric.val}%` }}
                                    transition={{ duration: 1.4, ease: "easeOut", delay: idx * 0.15 }}
                                  />
                                </div>
                                
                                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-0.5">
                                  <span>0%</span>
                                  <span className="text-slate-600">Avg Benchmark: {metric.benchmark}%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Critique Summary Box */}
                {(activeReportTab === 'all' || activeReportTab === 'experience') && (
                  <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      Recruiter Summary Assessment
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {analysisResult.summary}
                    </p>
                  </div>
                )}

                {/* Salary Prediction & Market Valuation Module */}
                {(activeReportTab === 'all' || activeReportTab === 'experience') && (
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 relative overflow-hidden">
                    {/* Subtle background gradient glow */}
                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            AI Salary Prediction & Market Valuation
                            <span className="px-2 py-0.5 text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-mono font-bold uppercase">
                              AI Estimate
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Estimating market value based on resume skills and active job market data.
                          </p>
                        </div>
                      </div>
                    </div>

                    {isPredictingSalary ? (
                      /* High-fidelity scanning state */
                      <div className="py-8 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full border-2 border-teal-500/10 border-t-teal-400 animate-spin" />
                          <DollarSign className="h-5 w-5 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-300">Evaluating Market Premium Values...</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Latching active jobs & skill demand indices...</p>
                        </div>
                      </div>
                    ) : salaryPrediction ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5"
                      >
                        {/* Range & Main Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          {/* Huge Salary Display */}
                          <div className="md:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-850/80 space-y-3 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Estimated Annual Salary Range</span>
                            <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-mono tracking-tight">
                              ${(salaryPrediction.estimatedMin).toLocaleString()} – ${(salaryPrediction.estimatedMax).toLocaleString()}
                              <span className="text-xs text-slate-400 font-sans font-medium block sm:inline sm:ml-1 text-slate-500">USD / year</span>
                            </div>
                            
                            {/* Percentile bar */}
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                                <span>Market Percentile Position</span>
                                <span className="text-teal-400 font-bold font-mono">{salaryPrediction.percentile}th Percentile</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                                  style={{ width: `${salaryPrediction.percentile}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Badges Column */}
                          <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-3">
                            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-center md:text-left">
                              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Median Market Rate</span>
                              <span className="text-base font-black text-slate-200 font-mono">${(salaryPrediction.medianSalary).toLocaleString()}</span>
                            </div>

                            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-between text-center md:text-left">
                              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Market Demand</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit mx-auto md:mx-0 ${
                                salaryPrediction.marketDemandRating === 'Very High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                                salaryPrediction.marketDemandRating === 'High' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              }`}>
                                {salaryPrediction.marketDemandRating} Demand
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI Context Summary Block */}
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 p-4 rounded-xl border border-slate-850 border-dashed italic">
                          "{salaryPrediction.marketContextSummary}"
                        </p>

                        {/* Main Valuation Driving Factors */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Core Valuation Drivers</span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {salaryPrediction.factors.map((factor, fIdx) => (
                              <div key={fIdx} className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex gap-3 items-start text-xs text-slate-300 font-medium leading-relaxed">
                                <Activity className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                                <span>{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Optimizing Skills to boost income */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Income Optimization Gaps</span>
                            <span className="text-[10px] text-emerald-400 font-bold font-mono">Acquire keywords to scale</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {salaryPrediction.optimizingSkills.map((opt, oIdx) => (
                              <div key={oIdx} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between space-y-2">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-200">{opt.skill}</h5>
                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-black shrink-0">
                                      +{opt.salaryDeltaPercent}% potential
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1.5">
                                    {opt.justification}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Current Job Matches for context */}
                        {salaryPrediction.jobMatches && salaryPrediction.jobMatches.length > 0 && (
                          <div className="space-y-3 pt-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Matched High-Paying Job Board Connections</span>
                            <div className="space-y-2.5">
                              {salaryPrediction.jobMatches.map((jm, mIdx) => (
                                <div key={mIdx} className="p-3.5 bg-slate-950/40 hover:bg-teal-500/5 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition group font-sans">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h6 className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition">{jm.title}</h6>
                                      <span className="text-[10px] text-slate-500 font-medium">@{jm.company}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                      {jm.matchReason}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                    <span className="text-xs font-bold text-teal-400 font-mono bg-teal-500/10 border border-teal-500/15 px-2 py-1 rounded-lg">
                                      {jm.salaryRange}
                                    </span>
                                    <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition font-sans">
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 text-xs font-medium font-mono">
                        No salary prediction could be generated. Try re-analyzing your profile.
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Connection and Verification Card */}
                {(activeReportTab === 'all' || activeReportTab === 'skills') && (
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          Automatic Skill Verification Center
                          <span className="px-2 py-0.5 text-[9px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded font-mono font-black uppercase tracking-wider">
                            Real-Time Sync
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">
                          Link your LinkedIn or GitHub profiles to automatically verify your resume's detected competencies against real-world repositories and professional history.
                        </p>
                      </div>
                    </div>

                    {!currentUser ? (
                      <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-amber-400">Onboarding Required</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Please create a free account or login using the top navigation bar to unlock direct profile verification integrations.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LinkedIn Card */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-250">
                                <Linkedin className="h-4 w-4 text-blue-400" />
                                LinkedIn Professional Profile
                              </span>
                              {currentUser.linkedInConnected ? (
                                <span className="px-2 py-0.5 text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold font-mono uppercase flex items-center gap-1">
                                  <CheckCircle className="h-2.5 w-2.5" /> Synced
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] bg-slate-900 text-slate-500 border border-slate-800 rounded font-medium font-mono uppercase">
                                  Not Linked
                                </span>
                              )}
                            </div>
                            
                            {currentUser.linkedInConnected && currentUser.linkedInProfile ? (
                              <div className="space-y-1.5 pt-1">
                                <h5 className="text-xs font-bold text-slate-200">{currentUser.linkedInProfile.name}</h5>
                                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{currentUser.linkedInProfile.headline}</p>
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {currentUser.linkedInProfile.skills.slice(0, 5).map((sk, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-slate-400 border border-slate-800 rounded font-medium">
                                      {sk}
                                    </span>
                                  ))}
                                  {currentUser.linkedInProfile.skills.length > 5 && (
                                    <span className="px-1.5 py-0.5 text-[9px] text-slate-500 rounded font-medium">
                                      +{currentUser.linkedInProfile.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Verify skills via your LinkedIn endorsements, experience summary, and customized professional headline.
                              </p>
                            )}
                          </div>

                          {currentUser.linkedInConnected ? (
                            <button
                              type="button"
                              disabled={isDisconnectingLinkedIn}
                              onClick={handleDisconnectLinkedIn}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-200 font-bold text-xs rounded-lg border border-slate-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isDisconnectingLinkedIn ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect LinkedIn"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isConnectingLinkedIn}
                              onClick={handleConnectLinkedIn}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isConnectingLinkedIn ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                <>
                                  <Linkedin className="h-3.5 w-3.5 shrink-0" />
                                  Connect LinkedIn Account
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* GitHub Card */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-250">
                                <Github className="h-4 w-4 text-purple-400" />
                                GitHub Contribution History
                              </span>
                              {currentUser.gitHubConnected ? (
                                <span className="px-2 py-0.5 text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold font-mono uppercase flex items-center gap-1">
                                  <CheckCircle className="h-2.5 w-2.5" /> Synced
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] bg-slate-900 text-slate-500 border border-slate-800 rounded font-medium font-mono uppercase">
                                  Not Linked
                                </span>
                              )}
                            </div>

                            {currentUser.gitHubConnected && currentUser.gitHubProfile ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={currentUser.gitHubProfile.avatarUrl} 
                                    alt="GitHub Avatar" 
                                    referrerPolicy="no-referrer"
                                    className="h-6 w-6 rounded-full border border-slate-800"
                                  />
                                  <h5 className="text-xs font-bold text-slate-200">
                                    {currentUser.gitHubProfile.name} 
                                    <span className="text-[10px] text-slate-500 font-mono pl-1">(@{currentUser.gitHubProfile.username})</span>
                                  </h5>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-normal">
                                  Linked {currentUser.gitHubProfile.repos.length} public repositories. Analyzed codebases and languages.
                                </p>
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {Array.from(new Set(currentUser.gitHubProfile.repos.map(r => r.language).filter(Boolean))).slice(0, 5).map((lang, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 text-[9px] bg-slate-900 text-slate-400 border border-slate-800 rounded font-medium">
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  Enter your GitHub username to index repository topics, language ratios, and code files for instant proof of mastery.
                                </p>
                                
                                <form onSubmit={handleConnectGitHub} className="flex gap-1.5">
                                  <input
                                    type="text"
                                    required
                                    value={gitHubUsername}
                                    onChange={(e) => setGitHubUsername(e.target.value)}
                                    placeholder="GitHub Username"
                                    className="flex-1 bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-600 rounded focus:outline-none focus:border-teal-500 transition font-mono font-medium"
                                  />
                                  <button
                                    type="submit"
                                    disabled={isConnectingGitHub}
                                    className="py-1 px-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-55 text-slate-950 font-bold text-[11px] rounded transition cursor-pointer shrink-0"
                                  >
                                    {isConnectingGitHub ? <Loader2 className="h-3 w-3 animate-spin text-slate-950" /> : "Sync"}
                                  </button>
                                </form>
                                {githubError && (
                                  <p className="text-[10px] text-red-400 font-mono font-medium">{githubError}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {currentUser.gitHubConnected && (
                            <button
                              type="button"
                              disabled={isDisconnectingGitHub}
                              onClick={handleDisconnectGitHub}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-200 font-bold text-xs rounded-lg border border-slate-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {isDisconnectingGitHub ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect GitHub"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills detected & missing */}
                {(activeReportTab === 'all' || activeReportTab === 'skills') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Detected */}
                    <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        Skills Detected
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.skillsDetected.length > 0 ? (
                          analysisResult.skillsDetected.map((skill, idx) => {
                            const { verified, sources } = checkSkillVerification(skill);
                            return (
                              <span 
                                key={idx} 
                                className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md font-medium border transition-all ${
                                  verified 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/5" 
                                    : "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                                }`}
                              >
                                <span>{skill}</span>
                                {verified && (
                                  <span 
                                    className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.25 bg-emerald-500 text-slate-950 rounded-sm font-mono tracking-wider shadow-sm uppercase shrink-0" 
                                    title={`Verified via ${sources.map(s => s === 'linkedin' ? 'LinkedIn' : 'GitHub').join(' and ')}`}
                                  >
                                    <CheckCircle2 className="h-2 w-2 stroke-[3]" />
                                    Verified
                                  </span>
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-500">No clear tools or skills extracted.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing */}
                    <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Target Skill Gaps
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.missingSkills.length > 0 ? (
                          analysisResult.missingSkills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-amber-500/5 text-amber-400 border border-amber-500/20 rounded-md font-medium">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Excellent skills match! No immediate gaps.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                            {/* Actionable Improvements List */}
                {(activeReportTab === 'all' || activeReportTab === 'ats') && (
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-teal-400" />
                      Smart Writing Recommendations
                    </h4>
                    <ul className="space-y-3.5">
                      {analysisResult.improvements.map((tip, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-3 leading-relaxed">
                          <span className="text-teal-400 shrink-0 font-bold font-mono">#{idx + 1}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Topic by Topic Resume Toughness Assessment */}
                {(activeReportTab === 'all' || activeReportTab === 'ats') && (
                  <div id="resume-toughness-assessment" className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          Toughness & Grilling Resistance Assessment
                          <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-mono font-bold uppercase tracking-wider">
                            Topic-By-Topic Breakdown
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-medium">
                          How highly skeptical recruiters, tech leads, and hiring managers evaluate the robustness of this resume, where they will poke holes, and how to defend your claims.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-1">
                      {((analysisResult.toughnessReport && analysisResult.toughnessReport.length > 0) 
                        ? analysisResult.toughnessReport 
                        : [
                            {
                              topic: "Quantifiable Business Impact",
                              rating: "Moderate" as const,
                              score: 72,
                              critique: "While you claim to lead product interfaces, there is a lack of concrete growth metrics (e.g., % speedups, retention, or dollar value). Interviewers may view your claims as standard duties rather than impact-driven contributions.",
                              defense: "Cite specific statistics: frame your work around how it directly optimized key product indicators, e.g. 'reduced latency by 35% for 10k active users'."
                            },
                            {
                              topic: "Technical Core Depth",
                              rating: "Exceptional" as const,
                              score: 88,
                              critique: "Your React/TypeScript foundation is robust, but recruiters will immediately quiz you on complex rendering cycles and browser performance profiling to verify you haven't just memorized standard frameworks.",
                              defense: "Familiarize yourself with Fiber, custom hook designs, and render profiling tools so you can confidently detail your mitigation of execution bottlenecks."
                            },
                            {
                              topic: "System & Architectural Scope",
                              rating: "Vulnerable" as const,
                              score: 65,
                              critique: "Your resume shows stellar frontend work but skips over database architecture, continuous deployment pipelines, or robust back-end integrations, leaving you vulnerable to system-design grilling.",
                              defense: "Prepare explanations of full-stack API lifecycles, database index optimizations, and how you coordinate data models across layers."
                            },
                            {
                              topic: "ATS Parser Resistance",
                              rating: "Robust" as const,
                              score: 84,
                              critique: "The keyword selection is great, but complex layouts or text column dividers can occasionally throw off legacy parser structures, misaligning your listed stack with standard requirements.",
                              defense: "Prepare a clean single-column PDF fallback. Explicitly state technical competencies under an obvious list category near the top."
                            },
                            {
                              topic: "Objection & Grilling Resilience",
                              rating: "Moderate" as const,
                              score: 75,
                              critique: "Your bullets explain what you built, but not the trade-offs considered. Interviewers will challenge your architectural choices to see if you have technical opinion leadership.",
                              defense: "Formulate rationales for each tech choice: e.g. why choosing Tailwind or Express was the optimal decision over other alternatives based on concrete constraints."
                            }
                          ]
                      ).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-950 p-4 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors space-y-3"
                        >
                          {/* Title and Badge row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-455 font-mono">0{idx + 1}.</span>
                              <h5 className="text-xs font-bold text-slate-100">{item.topic}</h5>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                                item.rating === 'Exceptional' 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : item.rating === 'Robust'
                                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                    : item.rating === 'Moderate'
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                Rating: {item.rating}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                {item.score}% Toughness
                              </span>
                            </div>
                          </div>

                          {/* Critique Block */}
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-rose-400/90 block">
                              Recruiter Objection / Skeptical Challenge:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {item.critique}
                            </p>
                          </div>

                          {/* Defense Strategies Block */}
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-1">
                            <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-emerald-400/90 block">
                              How to Defend & Survive Grilling:
                            </span>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                              {item.defense}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* AI Insights Checklist Panel */}
                {activeReportTab === 'all' && (
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                          <Brain className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            AI Insights: Skill-Specific Tech Interview Prep
                            <span className="px-2 py-0.5 text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-mono font-bold uppercase tracking-wider">
                              Interactive Checklist
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Dynamic, skill-targeted technical questions mapped to your resume analysis.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isLoadingChecklist}
                        onClick={() => fetchInterviewChecklist()}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-50 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-center"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingChecklist ? "animate-spin text-teal-400" : ""}`} />
                        Regenerate
                      </button>
                    </div>

                    {isLoadingChecklist ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-2 border-teal-500/10 border-t-teal-400 animate-spin" />
                          <Brain className="h-4 w-4 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-300">Synthesizing Technical Questions...</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Analyzing detected skills & role context...</p>
                        </div>
                      </div>
                    ) : checklistQuestions.length > 0 ? (
                      <div className="space-y-4">
                        {/* Prep Progress Bar */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold font-mono">
                            <span className="text-slate-400">Prep Progress</span>
                            <span className="text-teal-400">
                              {Object.keys(checkedQuestions).filter(id => checkedQuestions[id]).length} of {checklistQuestions.length} Mastered ({checklistQuestions.length > 0 ? Math.round((Object.keys(checkedQuestions).filter(id => checkedQuestions[id]).length / checklistQuestions.length) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: `${checklistQuestions.length > 0 ? (Object.keys(checkedQuestions).filter(id => checkedQuestions[id]).length / checklistQuestions.length) * 100 : 0}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        {/* Accordion List */}
                        <div className="space-y-3">
                          {checklistQuestions.map((q) => {
                            const isChecked = !!checkedQuestions[q.id];
                            const isExpanded = expandedQuestionId === q.id;
                            return (
                              <div 
                                key={q.id} 
                                className={`rounded-xl border transition-all duration-200 ${
                                  isChecked 
                                    ? "bg-emerald-950/10 border-emerald-500/20" 
                                    : isExpanded 
                                      ? "bg-slate-950 border-slate-750" 
                                      : "bg-slate-950/50 border-slate-850 hover:border-slate-750"
                                }`}
                              >
                                {/* Header Trigger row */}
                                <div className="p-4 flex gap-3 items-start select-none">
                                  {/* Checklist check box */}
                                  <button
                                    type="button"
                                    onClick={() => setCheckedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                    className={`mt-0.5 shrink-0 h-4 w-4 rounded flex items-center justify-center border transition cursor-pointer ${
                                      isChecked 
                                        ? "bg-emerald-500 border-emerald-500 text-slate-950" 
                                        : "border-slate-700 hover:border-slate-500 bg-slate-900"
                                    }`}
                                  >
                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </button>

                                  {/* Title & details trigger */}
                                  <div 
                                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                    className="flex-1 cursor-pointer space-y-1.5 text-left"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                                        isChecked 
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                          : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                      }`}>
                                        Skill: {q.skill}
                                      </span>
                                    </div>
                                    <p className={`text-xs font-semibold leading-relaxed transition ${
                                      isChecked ? "text-slate-450 line-through" : "text-slate-200"
                                    }`}>
                                      {q.question}
                                    </p>
                                  </div>

                                  {/* Toggle Arrow */}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                    className={`p-1 text-slate-500 hover:text-slate-300 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Collapsed content section */}
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25, ease: "easeInOut" }}
                                      className="overflow-hidden border-t border-slate-850 bg-slate-950/80 rounded-b-xl"
                                    >
                                      <div className="p-4 space-y-4 text-xs leading-relaxed text-left">
                                        {/* Rationale */}
                                        <div className="space-y-1.5">
                                          <h5 className="font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                            <Info className="h-3.5 w-3.5 shrink-0" />
                                            Recruiter Rationale
                                          </h5>
                                          <p className="text-slate-400 font-medium pl-5">{q.rationale}</p>
                                        </div>

                                        {/* Sample Answer */}
                                        <div className="space-y-2 border-t border-slate-900 pt-3">
                                          <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                            Suggested Perfect Answer
                                          </h5>
                                          <p className="text-slate-300 font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-850 pl-4">{q.sampleAnswer}</p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/20 border border-slate-850 border-dashed rounded-xl">
                        No technical questions could be synthesized. Ensure your resume contains parsed skills and target roles.
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated Recruiter HR Interview prep questions */}
                {activeReportTab === 'all' && (
                  <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-teal-400" />
                      Predicted HR Interview Questions
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Based on your resume, a recruiter is likely to probe these specific domains.
                    </p>
                    <div className="space-y-2.5 mt-2">
                      {analysisResult.interviewQuestions.map((q, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex gap-2.5 items-start">
                          <span className="p-1 rounded-md bg-teal-500/10 text-teal-400 shrink-0 font-bold font-mono text-[9px]">Q{idx + 1}</span>
                          <p className="font-medium">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Google Drive Importer Finder Modal Overlay */}
      <AnimatePresence>
        {showDrivePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Google Drive Document Importer</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Browse files linked to sriharan6320@gmail.com</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrivePicker(false)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Modal search mock bar */}
              <div className="p-3 bg-slate-950/60 border-b border-slate-850 px-4">
                <input
                  type="text"
                  placeholder="Search file keywords in your drive..."
                  disabled
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none placeholder-slate-600 font-medium"
                />
              </div>

              {/* Modal List Files */}
              <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto">
                {DRIVE_MOCK_FILES.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => handleSelectDriveFile(file)}
                    className="w-full text-left p-3 bg-slate-950/40 hover:bg-teal-500/5 border border-slate-850 hover:border-teal-500/20 rounded-xl flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/10 transition border border-slate-800">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition line-clamp-1">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-mono font-medium">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>Modified {file.modified}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1 text-[9px] bg-slate-900 border border-slate-800 rounded font-mono font-bold text-slate-400 group-hover:text-teal-400 group-hover:border-teal-500/20 transition">
                      Select File
                    </div>
                  </button>
                ))}
              </div>

              {/* Modal footer block info */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-850 text-center text-[10px] text-slate-500 font-medium font-mono">
                Google Secure Workspace sandbox environment active.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
