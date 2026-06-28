export type UserRole = 'candidate' | 'hr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPremium: boolean;
  createdAt: string;
  linkedInConnected?: boolean;
  linkedInProfile?: {
    name: string;
    headline: string;
    location: string;
    industry: string;
    skills: string[];
  };
  gitHubConnected?: boolean;
  gitHubProfile?: {
    username: string;
    name: string;
    avatarUrl: string;
    repos: Array<{
      name: string;
      description: string;
      language: string;
      html_url: string;
    }>;
  };
}

export interface ToughnessTopic {
  topic: string;
  rating: 'Exceptional' | 'Robust' | 'Moderate' | 'Vulnerable';
  score: number;
  critique: string;
  defense: string;
}

export interface ResumeAnalysis {
  id: string;
  userId: string;
  candidateName: string;
  roleTarget: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  formattingScore: number;
  atsScore: number;
  skillsDetected: string[];
  missingSkills: string[];
  improvements: string[];
  interviewQuestions: string[];
  summary: string;
  predictedShortlistChance: number; // 0 to 100
  createdAt: string;
  toughnessReport?: ToughnessTopic[];
}

export interface CertificateAnalysis {
  id: string;
  userId: string;
  title: string;
  platform: string;
  predictedValue: 'Very High' | 'High' | 'Medium' | 'Low';
  valueReason: string;
  keySkillsGained: string[];
  industryDemandSummary: string;
  createdAt: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Remote';
  skillsRequired: string[];
  link: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface HRAnalytics {
  totalAnalyzed: number;
  averageAtsScore: number;
  highValueCandidates: number;
  rankings: {
    resumeId: string;
    candidateName: string;
    overallScore: number;
    predictedShortlistChance: number;
    skillsScore: number;
    experienceScore: number;
    formattingScore: number;
    atsScore: number;
    skillsDetected?: string[];
    missingSkills?: string[];
    improvements?: string[];
    interviewQuestions?: string[];
  }[];
  skillGaps: {
    skill: string;
    frequencyInResumes: number;
    requiredFrequency: number;
  }[];
  salaryPrediction: {
    suggestedRange: string;
    factors: string[];
  } | null;
}

export interface SalaryPrediction {
  id: string;
  resumeId: string;
  estimatedMin: number;
  estimatedMax: number;
  medianSalary: number;
  percentile: number;
  confidenceScore: number;
  marketDemandRating: 'Low' | 'Moderate' | 'High' | 'Very High';
  factors: string[];
  optimizingSkills: {
    skill: string;
    salaryDeltaPercent: number;
    justification: string;
  }[];
  jobMatches: {
    jobId: string;
    title: string;
    company: string;
    salaryRange: string;
    matchReason: string;
  }[];
  marketContextSummary: string;
}

export interface Interview {
  id: string;
  resumeId: string;
  candidateName: string;
  title: string;
  interviewerEmail: string;
  candidateEmail: string;
  dateTime: string;
  durationMinutes: number;
  description: string;
  meetLink?: string;
  googleEventId?: string;
  createdAt: string;
}

export interface SkillQuestion {
  id: string;
  skill: string;
  question: string;
  rationale: string;
  sampleAnswer: string;
}

export interface AIInsightsChecklist {
  questions: SkillQuestion[];
}


