import React, { useState } from "react";
import { 
  Award, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { CertificateAnalysis } from "../types";

interface CertificateAnalyzerTabProps {
  token: string | null;
  onAnalysisSuccess: (analysis: CertificateAnalysis) => void;
}

const SAMPLE_CERTIFICATES = {
  gcp: {
    title: "Google Cloud Professional Cloud Architect",
    platform: "Google Cloud / Coursera",
    certText: "This certifies that the candidate has completed the rigorous curriculum and examinations on professional systems architecture, secure cloud designs, scalable network infrastructure, and Kubernetes clusters deploy."
  },
  scrum: {
    title: "Certified ScrumMaster (CSM)",
    platform: "Scrum Alliance",
    certText: "Completed training on Agile mindset principles, daily standup coordination, sprint planning backlogs, scrum artifacts, and servant leadership techniques."
  }
};

export default function CertificateAnalyzerTab({ token, onAnalysisSuccess }: CertificateAnalyzerTabProps) {
  const [title, setTitle] = useState("Google Cloud Professional Cloud Architect");
  const [platform, setPlatform] = useState("Google Cloud / Coursera");
  const [certText, setCertText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CertificateAnalysis | null>(null);

  const triggerAnalysis = async (cTitle = title, cPlatform = platform, cText = certText) => {
    if (!cTitle.trim() || !cPlatform.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          title: cTitle,
          platform: cPlatform,
          certText: cText
        })
      });

      if (res.ok) {
        const data: CertificateAnalysis = await res.json();
        setAnalysisResult(data);
        onAnalysisSuccess(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = (type: 'gcp' | 'scrum') => {
    const sample = SAMPLE_CERTIFICATES[type];
    setTitle(sample.title);
    setPlatform(sample.platform);
    setCertText(sample.certText);
    triggerAnalysis(sample.title, sample.platform, sample.certText);
  };

  const getValueBadge = (val: string) => {
    switch(val) {
      case 'Very High':
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case 'High':
        return "bg-teal-500/10 text-teal-400 border border-teal-500/30";
      case 'Medium':
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/30";
    }
  };

  return (
    <div id="certificate-analyzer-tab" className="space-y-6">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2 font-display tracking-tight">
            <Award className="h-6 w-6 text-emerald-400" />
            <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent">AI Certificate Value Assessor</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Submit credentials and online training badges to gauge industry demand and career weight.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Try real credentials:</span>
          <button 
            id="load-sample-gcp"
            onClick={() => loadSample('gcp')}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 font-medium rounded-lg border border-teal-500/20 transition flex items-center gap-1"
          >
            Google Cloud Arch
          </button>
          <button 
            id="load-sample-scrum"
            onClick={() => loadSample('scrum')}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 font-medium rounded-lg border border-teal-500/20 transition flex items-center gap-1"
          >
            ScrumMaster
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input pane */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Certification Name / Title
              </label>
              <input 
                id="cert-title-input"
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-teal-500 transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Issuing Platform or Authority
              </label>
              <input 
                id="cert-platform-input"
                type="text" 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. Coursera / Amazon Web Services"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-teal-500 transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Additional Details or Verification Text (Optional)
              </label>
              <textarea 
                id="cert-text-input"
                value={certText}
                onChange={(e) => setCertText(e.target.value)}
                placeholder="Paste certification description, modules learned, or meta information here to increase evaluation accuracy."
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-teal-500 transition font-mono leading-relaxed resize-none"
              />
            </div>

            <button
              id="analyze-cert-btn"
              onClick={() => triggerAnalysis()}
              disabled={isAnalyzing || !title.trim() || !platform.trim()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Assessing Value...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Certificate Impact
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output pane */}
        <div className="lg:col-span-7">
          {isAnalyzing && (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-900/20 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                <Award className="h-6 w-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 animate-pulse">Running Credentials Evaluator</h3>
              <p className="text-sm text-slate-400 max-w-sm font-medium">
                Predicting recruiting weight, platform authority, and real-world employer demand indexes...
              </p>
            </div>
          )}

          {!isAnalyzing && !analysisResult && (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-900/20 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                <Award className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-300">No Credentials Checked</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  Enter your certificate title and provider on the left, or try one of the fast samples to review instantly.
                </p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {!isAnalyzing && analysisResult && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      {analysisResult.platform}
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-1">{analysisResult.title}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 text-center ${getValueBadge(analysisResult.predictedValue)}`}>
                    Industry Value: {analysisResult.predictedValue}
                  </div>
                </div>

                <hr className="border-slate-800" />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Professional Value Analysis
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {analysisResult.valueReason}
                  </p>
                </div>
              </div>

              {/* Skills gained */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Primary Competencies Acquired
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {analysisResult.keySkillsGained.map((skill, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 text-xs text-slate-300 font-semibold flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0"></span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Demand summary */}
              <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-start gap-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Employer Recruiting Demand Index</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
                    {analysisResult.industryDemandSummary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
