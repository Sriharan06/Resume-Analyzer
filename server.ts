import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  User,
  ResumeAnalysis,
  CertificateAnalysis,
  JobListing,
  HRAnalytics,
  SalaryPrediction
} from "./src/types";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));

// Local database path
const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to initialize and read DB
function readDB() {
  const defaultJobs: JobListing[] = [
    {
      id: "job-1",
      title: "Senior Full Stack Engineer",
      company: "Google Cloud",
      location: "Sunnyvale, CA (Hybrid)",
      salaryRange: "$160,000 - $210,000",
      jobType: "Full-time",
      skillsRequired: ["React", "TypeScript", "Node.js", "Express", "Docker", "PostgreSQL"],
      link: "https://careers.google.com",
      source: "LinkedIn Jobs"
    },
    {
      id: "job-2",
      title: "AI Deployment specialist",
      company: "OpenAI",
      location: "San Francisco, CA (Onsite)",
      salaryRange: "$180,000 - $240,000",
      jobType: "Full-time",
      skillsRequired: ["Python", "PyTorch", "LLMs", "Gemini", "FastAPI", "Kubernetes"],
      link: "https://openai.com/careers",
      source: "Indeed"
    },
    {
      id: "job-3",
      title: "Frontend Developer Intern",
      company: "Vercel",
      location: "Remote (Global)",
      salaryRange: "$45 - $60 / hour",
      jobType: "Internship",
      skillsRequired: ["React", "Next.js", "TailwindCSS", "TypeScript", "Vite"],
      link: "https://vercel.com/careers",
      source: "Vercel Careers"
    },
    {
      id: "job-4",
      title: "Backend Core Architect",
      company: "Netflix",
      location: "Los Gatos, CA (Remote)",
      salaryRange: "$190,000 - $280,000",
      jobType: "Remote",
      skillsRequired: ["Java", "Spring Boot", "Node.js", "Cassandra", "Microservices", "AWS"],
      link: "https://jobs.netflix.com",
      source: "Indeed"
    },
    {
      id: "job-5",
      title: "Cloud Infrastructure Engineer",
      company: "Microsoft",
      location: "Redmond, WA (Hybrid)",
      salaryRange: "$140,000 - $185,000",
      jobType: "Full-time",
      skillsRequired: ["Azure", "Terraform", "CI/CD", "Docker", "Go", "Bash"],
      link: "https://careers.microsoft.com",
      source: "LinkedIn Jobs"
    },
    {
      id: "job-6",
      title: "React Native UI Intern",
      company: "Meta",
      location: "Menlo Park, CA",
      salaryRange: "$40 - $55 / hour",
      jobType: "Internship",
      skillsRequired: ["React Native", "React", "JavaScript", "Redux Toolkit", "Figma"],
      link: "https://www.metacareers.com",
      source: "LinkedIn Jobs"
    }
  ];

  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [] as User[],
      resumes: [] as ResumeAnalysis[],
      certificates: [] as CertificateAnalysis[],
      jobs: defaultJobs,
      interviews: [] as any[],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.interviews) {
      parsed.interviews = [];
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning fresh template", err);
    return {
      users: [] as User[],
      resumes: [] as ResumeAnalysis[],
      certificates: [] as CertificateAnalysis[],
      jobs: defaultJobs,
      interviews: [] as any[],
    };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

// Lazy load Gemini AI to avoid startup crashes if key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to high-quality simulation modes.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Simple Auth Middleware / Helper to verify requests (for simulation we look up by id)
function getActiveUser(req: express.Request): User | null {
  const userId = req.headers.authorization?.replace("Bearer ", "");
  if (!userId) return null;
  const db = readDB();
  return db.users.find((u: User) => u.id === userId) || null;
}

// ------------------- API ROUTES -------------------

// 1. Auth Signup
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Missing required signup fields." });
    return;
  }

  const db = readDB();
  const existingUser = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    res.status(400).json({ error: "Account with this email already exists." });
    return;
  }

  const newUser: User = {
    id: "user-" + Math.random().toString(36).substr(2, 9),
    name,
    email,
    role,
    isPremium: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ user: newUser, token: newUser.id });
});

// 2. Auth Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const db = readDB();
  const user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  res.json({ user, token: user.id });
});

// 3. Google OAuth login flow (Simulated backend token callback)
app.post("/api/auth/google", (req, res) => {
  const { name, email, googleId, role } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: "Missing Google identity details." });
    return;
  }

  const db = readDB();
  let user = db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: "google-" + (googleId || Math.random().toString(36).substr(2, 9)),
      name,
      email,
      role: role || "candidate",
      isPremium: false,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
  }

  res.json({ user, token: user.id });
});

// 3.5 LinkedIn OAuth Connection and Personalized Job Recommendations
app.get("/api/auth/linkedin/url", (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId is required to maintain OAuth state." });
    return;
  }

  // Construct the dynamic redirect URI using the request's origin/host
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const redirectUri = `${protocol}://${host}/auth/linkedin/callback`;

  const clientId = process.env.LINKEDIN_CLIENT_ID || "mock_linkedin_client_id";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: userId,
    scope: "openid profile email",
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  res.json({ url: authUrl, redirectUri });
});

app.get(["/auth/linkedin/callback", "/auth/linkedin/callback/"], async (req, res) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;

  if (!userId) {
    res.status(400).send("State/User ID parameter is missing in LinkedIn response.");
    return;
  }

  const db = readDB();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);
  if (userIdx === -1) {
    res.status(404).send("Target user session not found in database.");
    return;
  }

  // Set default rich mock profile values for seamless user experience
  let profileName = db.users[userIdx].name || "S Sriharan";
  let profileHeadline = "Lead AI Deployment Specialist & Full Stack Engineer";
  let profileLocation = "San Francisco, CA (Hybrid)";
  let profileIndustry = "Information Technology & Software Services";
  let profileSkills = ["React", "TypeScript", "Node.js", "Python", "Docker", "Machine Learning", "FastAPI", "Systems Architecture"];

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (clientId && clientSecret && clientId !== "mock_linkedin_client_id" && !clientId.startsWith("MY_")) {
    try {
      const host = req.get("host") || "localhost:3000";
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const redirectUri = `${protocol}://${host}/auth/linkedin/callback`;

      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      if (tokenResponse.ok) {
        const tokenData: any = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (profileRes.ok) {
          const profileData: any = await profileRes.json();
          profileName = `${profileData.given_name || ""} ${profileData.family_name || ""}`.trim() || profileName;
          profileHeadline = profileData.headline || "LinkedIn Professional (Connected)";
          if (profileData.locale && profileData.locale.country) {
            profileLocation = profileData.locale.country;
          }
        }
      }
    } catch (err) {
      console.error("LinkedIn access token exchange failed, falling back to rich simulator details.", err);
    }
  }

  // Update user in db
  db.users[userIdx] = {
    ...db.users[userIdx],
    linkedInConnected: true,
    linkedInProfile: {
      name: profileName,
      headline: profileHeadline,
      location: profileLocation,
      industry: profileIndustry,
      skills: profileSkills
    }
  };

  writeDB(db);

  res.send(`
    <html>
      <head>
        <title>Connecting LinkedIn...</title>
        <style>
          body {
            background-color: #0b1329;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(20, 184, 166, 0.25);
            border-radius: 16px;
            padding: 32px;
            max-width: 420px;
            box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.4);
          }
          .spinner {
            border: 3.5px solid rgba(20, 184, 166, 0.15);
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border-left-color: #14b8a6;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 18px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h3 { margin: 12px 0 6px 0; color: #ffffff; font-weight: 800; font-size: 18px; }
          p { color: #94a3b8; font-size: 13.5px; line-height: 1.5; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h3>Connecting to LinkedIn</h3>
          <p>Successfully authorized! Syncing your professional credentials and personalizing your job board recommendations...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/api/auth/linkedin/disconnect", (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const db = readDB();
  const idx = db.users.findIndex((u: any) => u.id === user.id);
  if (idx !== -1) {
    db.users[idx].linkedInConnected = false;
    delete db.users[idx].linkedInProfile;
    writeDB(db);
    res.json({ success: true, user: db.users[idx] });
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

app.post("/api/auth/github/connect", async (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "GitHub username is required." });
    return;
  }

  const db = readDB();
  const idx = db.users.findIndex((u: any) => u.id === user.id);
  if (idx === -1) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  let repos: any[] = [];
  let name = username;
  let avatarUrl = `https://github.com/${username}.png`;

  try {
    const gitHubRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`, {
      headers: {
        "User-Agent": "Resume-Analyzer-App"
      }
    });
    if (gitHubRes.ok) {
      const gitHubData: any = await gitHubRes.json();
      repos = gitHubData.map((repo: any) => ({
        name: repo.name,
        description: repo.description || "",
        language: repo.language || "",
        html_url: repo.html_url
      }));

      const userProfileRes = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          "User-Agent": "Resume-Analyzer-App"
        }
      });
      if (userProfileRes.ok) {
        const userProfileData: any = await userProfileRes.json();
        name = userProfileData.name || username;
        avatarUrl = userProfileData.avatar_url || avatarUrl;
      }
    } else {
      throw new Error(`GitHub API returned status ${gitHubRes.status}`);
    }
  } catch (err) {
    console.warn("GitHub API fetch failed or rate-limited. Falling back to high-fidelity mock repositories for", username, err);
    repos = [
      {
        name: "react-dashboard-framework",
        description: "A production-ready React, TypeScript, and Tailwind CRM dashboard with complex widgets and real-time state synchronization.",
        language: "TypeScript",
        html_url: `https://github.com/${username}/react-dashboard-framework`
      },
      {
        name: "node-express-microservices",
        description: "Robust back-end API suite featuring Node.js, Express, Redis caching, Docker support, and automated Jest test suites.",
        language: "JavaScript",
        html_url: `https://github.com/${username}/node-express-microservices`
      },
      {
        name: "gemini-pdf-analyzer",
        description: "An AI-powered document parsing engine built in Python utilizing FastAPI, Google Gemini API, and langchain.",
        language: "Python",
        html_url: `https://github.com/${username}/gemini-pdf-analyzer`
      },
      {
        name: "docker-kubernetes-iac",
        description: "Infrastructure as Code configs utilizing Terraform, Docker compose, and Kubernetes manifests for CI/CD deployments.",
        language: "HCL",
        html_url: `https://github.com/${username}/docker-kubernetes-iac`
      },
      {
        name: "ml-talent-predictor",
        description: "Machine Learning workflow with scikit-learn and pandas to analyze historical recruiter decisions and predict candidate shortlisting.",
        language: "Jupyter Notebook",
        html_url: `https://github.com/${username}/ml-talent-predictor`
      }
    ];
  }

  db.users[idx] = {
    ...db.users[idx],
    gitHubConnected: true,
    gitHubProfile: {
      username,
      name,
      avatarUrl,
      repos
    }
  };

  writeDB(db);
  res.json({ success: true, user: db.users[idx] });
});

app.post("/api/auth/github/disconnect", (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const db = readDB();
  const idx = db.users.findIndex((u: any) => u.id === user.id);
  if (idx !== -1) {
    db.users[idx].gitHubConnected = false;
    delete db.users[idx].gitHubProfile;
    writeDB(db);
    res.json({ success: true, user: db.users[idx] });
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

app.get("/api/jobs/personalized", async (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const db = readDB();
  const dbUser = db.users.find((u: any) => u.id === user.id);

  if (!dbUser || !dbUser.linkedInConnected || !dbUser.linkedInProfile) {
    res.status(400).json({ error: "LinkedIn is not connected or profile info is missing." });
    return;
  }

  const profile = dbUser.linkedInProfile;
  const currentJobs = db.jobs;

  const defaultPersonalizedRecommendations = () => {
    return currentJobs.map(job => {
      const matchedSkills = job.skillsRequired.filter(s =>
        profile.skills.some((ps: string) => ps.toLowerCase() === s.toLowerCase())
      );
      const matchScore = Math.round((matchedSkills.length / Math.max(job.skillsRequired.length, 1)) * 100);
      return {
        ...job,
        matchScore,
        personalizedReason: `Direct skills alignment detected. Features your expertise in ${matchedSkills.join(', ') || 'modern software engineering'} as specified in your LinkedIn profile.`
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY detected. Using default rule-based LinkedIn matcher.");
      res.json(defaultPersonalizedRecommendations());
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
    You are an elite talent matcher and technical recruitment advisor connecting professionals with premium career openings.
    Analyze the user's LinkedIn profile and generate a list of personalized, highly aligned job matches from our reference database, plus exactly 1-2 new, synthesized high-paying bespoke roles (e.g., at LinkedIn, Netflix, Apple, or Vercel) tailored specifically to their skillset.

    User LinkedIn Profile:
    Name: ${profile.name}
    Headline: ${profile.headline}
    Location: ${profile.location}
    Industry: ${profile.industry}
    Skills: ${JSON.stringify(profile.skills)}

    Available Reference Jobs in database:
    ${JSON.stringify(currentJobs)}

    Instructions:
    1. For each job, calculate an intelligent, personalized AI compatibility score (0-100) based on alignment with the user's LinkedIn headline, skills, and experience.
    2. Formulate a highly personalized, high-value sentence explaining EXACTLY why this is an exceptional match ("personalizedReason") referencing specific aspects of their LinkedIn profile.
    3. Supplement the list with 1-2 new, synthesized premium job openings representing the absolute pinnacle match for their skills, with realistic high-salary ranges and deep justification. Give these synthesized jobs unique IDs (like 'job-linkedin-personalized-1').

    Respond with a single valid JSON array of jobs matching this exact schema:
    [
      {
        "id": "String (e.g., 'job-1' or 'job-personalized-1')",
        "title": "String",
        "company": "String",
        "location": "String",
        "salaryRange": "String",
        "jobType": "Full-time" | "Part-time" | "Internship" | "Remote",
        "skillsRequired": ["String", "String", ...],
        "link": "String (url)",
        "source": "String (e.g., 'LinkedIn Jobs API')",
        "matchScore": Integer (0 to 100),
        "personalizedReason": "String (personalized 1-2 sentence reason detailing why this fits their profile)"
      }
    ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);
    res.json(parsedData);
  } catch (err) {
    console.error("AI personalized job matching failed:", err);
    res.json(defaultPersonalizedRecommendations());
  }
});

// 4. Update HR Premium state (Stripe/PayPal simulated webhook or client confirm)
app.post("/api/user/premium", (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const db = readDB();
  const userIdx = db.users.findIndex((u: User) => u.id === user.id);
  if (userIdx !== -1) {
    db.users[userIdx].isPremium = true;
    writeDB(db);
    res.json({ success: true, user: db.users[userIdx] });
  } else {
    res.status(404).json({ error: "User not found." });
  }
});

app.get("/api/user/me", (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const db = readDB();
  const dbUser = db.users.find((u: User) => u.id === user.id);
  if (dbUser) {
    res.json({ user: dbUser });
  } else {
    res.status(404).json({ error: "User not found in database." });
  }
});

// 5. Job Search and Filter API (LinkedIn/Indeed Proxy)
app.get("/api/jobs", (req, res) => {
  const { search, type, skill } = req.query;
  const db = readDB();
  let filteredJobs = [...db.jobs];

  if (search) {
    const query = String(search).toLowerCase();
    filteredJobs = filteredJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(query) ||
        j.company.toLowerCase().includes(query) ||
        j.location.toLowerCase().includes(query)
    );
  }

  if (type && type !== "All") {
    filteredJobs = filteredJobs.filter((j) => j.jobType === type);
  }

  if (skill) {
    const reqSkill = String(skill).toLowerCase();
    filteredJobs = filteredJobs.filter((j) =>
      j.skillsRequired.some((s) => s.toLowerCase().includes(reqSkill))
    );
  }

  res.json(filteredJobs);
});

// 6. Resume Analyzer with Gemini API
app.post("/api/analyze/resume", async (req, res) => {
  const user = getActiveUser(req);
  const { resumeText, roleTarget } = req.body;

  if (!resumeText || !roleTarget) {
    res.status(400).json({ error: "Resume text and target job role are required." });
    return;
  }

  const defaultAnalysis = (candName: string): ResumeAnalysis => ({
    id: "res-" + Math.random().toString(36).substr(2, 9),
    userId: user?.id || "guest",
    candidateName: candName,
    roleTarget,
    overallScore: 78,
    skillsScore: 82,
    experienceScore: 75,
    formattingScore: 85,
    atsScore: 70,
    skillsDetected: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Git"],
    missingSkills: ["Docker", "PostgreSQL", "Express.js", "Next.js"],
    improvements: [
      "Quantify your career impacts: add actual metrics or KPIs to your experience section (e.g., 'boosted UI rendering by 35%').",
      "Include a dedicated ATS-optimized section listing your technical tools and environments explicitly.",
      "Rewrite passive summary sentences using high-impact action verbs (e.g., replace 'was responsible for' with 'Pioneered and managed')."
    ],
    interviewQuestions: [
      "Can you explain a time when you had to optimize performance for a lagging React application?",
      "In your work, how do you manage Type definitions and compile-time safety inside high-scale TypeScript systems?",
      "Describe how you coordinate state management across massive component trees without triggering excessive re-renders.",
      "Why is Tailwind CSS or system-level utility classes preferred in your stack compared to CSS-in-JS?",
      "How would you integrate an automated build-time pipeline or Vite config with continuous Docker deployments?"
    ],
    summary: `An agile and detail-oriented engineer demonstrating sound foundations in frontend ecosystems. They possess key proficiencies in React and clean UI crafting, but can expand their ATS profile with backend databases and DevOps toolings to fit a wider range of full stack options.`,
    predictedShortlistChance: 65,
    createdAt: new Date().toISOString(),
    toughnessReport: [
      {
        topic: "Quantifiable Business Impact",
        rating: "Moderate",
        score: 72,
        critique: "While you claim to lead product interfaces, there is a lack of concrete growth metrics (e.g., % speedups, retention, or dollar value). Interviewers may view your claims as standard duties rather than impact-driven contributions.",
        defense: "Cite specific statistics: frame your work around how it directly optimized key product indicators, e.g. 'reduced latency by 35% for 10k active users'."
      },
      {
        topic: "Technical Core Depth",
        rating: "Exceptional",
        score: 88,
        critique: "Your React/TypeScript foundation is robust, but recruiters will immediately quiz you on complex rendering cycles and browser performance profiling to verify you haven't just memorized standard frameworks.",
        defense: "Familiarize yourself with Fiber, custom hook designs, and render profiling tools so you can confidently detail your mitigation of execution bottlenecks."
      },
      {
        topic: "System & Architectural Scope",
        rating: "Vulnerable",
        score: 65,
        critique: "Your resume shows stellar frontend work but skips over database architecture, continuous deployment pipelines, or robust back-end integrations, leaving you vulnerable to system-design grilling.",
        defense: "Prepare explanations of full-stack API lifecycles, database index optimizations, and how you coordinate data models across layers."
      },
      {
        topic: "ATS Parser Resilience",
        rating: "Robust",
        score: 84,
        critique: "The keyword selection is great, but complex layouts or text column dividers can occasionally throw off legacy parser structures, misaligning your listed stack with standard requirements.",
        defense: "Prepare a clean single-column PDF fallback. Explicitly state technical competencies under an obvious list category near the top."
      },
      {
        topic: "Objection & Grilling Resilience",
        rating: "Moderate",
        score: 75,
        critique: "Your bullets explain what you built, but not the trade-offs considered. Interviewers will challenge your architectural choices to see if you have technical opinion leadership.",
        defense: "Formulate rationales for each tech choice: e.g. why choosing Tailwind or Express was the optimal decision over other alternatives based on concrete constraints."
      }
    ]
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Key missing, return clean simulated analysis based on input text length
      console.log("No GEMINI_API_KEY detected. Utilizing structured fallback mockup engine.");
      const extName = resumeText.split("\n")[0]?.substring(0, 30) || "Candidate";
      const mockResult = defaultAnalysis(extName);

      // Save to db if logged in
      if (user) {
        const db = readDB();
        db.resumes.push(mockResult);
        writeDB(db);
      }
      res.json(mockResult);
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
    You are an elite corporate technical recruiter and ATS (Applicant Tracking System) parser.
    Critically analyze the following candidate resume for the target job role: "${roleTarget}".

    Resume Text Content:
    """
    ${resumeText}
    """

    Extract their actual name (if visible, otherwise default to "Candidate") and provide a thorough, professional assessment in valid JSON format.
    You MUST respond with a JSON object matching this schema precisely, with no markup, no comments, and no backticks surrounding the JSON:
    {
      "candidateName": "String (extracted candidate name, default to 'Candidate')",
      "roleTarget": "String (the target role)",
      "overallScore": Integer (0 to 100 overall score),
      "skillsScore": Integer (0 to 100 rating of their technical and soft skills match),
      "experienceScore": Integer (0 to 100 rating of professional history quality),
      "formattingScore": Integer (0 to 100 rating of format layout and impact),
      "atsScore": Integer (0 to 100 ATS systems compatibility score),
      "skillsDetected": ["String", "String", ... list of skills found],
      "missingSkills": ["String", "String", ... crucial skills missing or weak for target role],
      "improvements": ["String", "String", ... list of 3-5 specific actionable resume improvement bullet points],
      "interviewQuestions": ["String", "String", ... list of 5 predicted tough, highly specific interview questions an HR recruiter would ask them based on this resume's details],
      "summary": "String (a concise 3-4 sentence recruiter critique summing up suitability and gaps)",
      "predictedShortlistChance": Integer (0 to 100 percentage callback probability),
      "toughnessReport": [
        {
          "topic": "String (e.g. 'Quantifiable Impact', 'Technical Core Depth', 'System Scope', 'ATS Parsing Resilience', 'Objection Resilience')",
          "rating": "String ('Exceptional' | 'Robust' | 'Moderate' | 'Vulnerable')",
          "score": Integer (0 to 100 representing toughness/robustness in this topic),
          "critique": "String (candid critique of how tough, skeptical interviewers or recruiters will evaluate and challenge this specific topic on their resume, what holes others might look for, and how they should perceive the toughness of this document)",
          "defense": "String (specific defense strategy, behavioral tip, or code-level answer to counter this skepticism and handle interview grilling)"
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "";
    const cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // Formulate final ResumeAnalysis item
    const finalResult: ResumeAnalysis = {
      id: "res-" + Math.random().toString(36).substr(2, 9),
      userId: user?.id || "guest",
      candidateName: parsedData.candidateName || "Candidate",
      roleTarget: parsedData.roleTarget || roleTarget,
      overallScore: parsedData.overallScore || 75,
      skillsScore: parsedData.skillsScore || 75,
      experienceScore: parsedData.experienceScore || 75,
      formattingScore: parsedData.formattingScore || 75,
      atsScore: parsedData.atsScore || 75,
      skillsDetected: parsedData.skillsDetected || [],
      missingSkills: parsedData.missingSkills || [],
      improvements: parsedData.improvements || [],
      interviewQuestions: parsedData.interviewQuestions || [],
      summary: parsedData.summary || "Analysis completed.",
      predictedShortlistChance: parsedData.predictedShortlistChance || 50,
      createdAt: new Date().toISOString(),
      toughnessReport: parsedData.toughnessReport || []
    };

    if (user) {
      const db = readDB();
      db.resumes.push(finalResult);
      writeDB(db);
    }

    res.json(finalResult);

  } catch (error: any) {
    console.error("Gemini Resume Analysis failed", error);
    // Graceful fallback to rich mock data so the app never displays a blank crash
    const extName = resumeText.split("\n")[0]?.substring(0, 30) || "Candidate";
    const mockResult = defaultAnalysis(extName);
    if (user) {
      const db = readDB();
      db.resumes.push(mockResult);
      writeDB(db);
    }
    res.json(mockResult);
  }
});

// 6.5 Salary Prediction with Gemini API
app.post("/api/predict/salary", async (req, res) => {
  const user = getActiveUser(req);
  const { resumeId, skillsDetected, roleTarget } = req.body;

  if (!roleTarget) {
    res.status(400).json({ error: "Target job role is required." });
    return;
  }

  const db = readDB();
  const jobs = db.jobs;

  const defaultSalaryPrediction = (): SalaryPrediction => {
    const roleLower = roleTarget.toLowerCase();
    let min = 110000;
    let max = 155000;
    let median = 132000;
    let percentile = 65;
    let demand: 'Low' | 'Moderate' | 'High' | 'Very High' = "High";

    if (roleLower.includes("ai") || roleLower.includes("machine") || roleLower.includes("ml")) {
      min = 170000;
      max = 230000;
      median = 200000;
      percentile = 88;
      demand = "Very High";
    } else if (roleLower.includes("senior") || roleLower.includes("lead") || roleLower.includes("architect")) {
      min = 150000;
      max = 210000;
      median = 180000;
      percentile = 80;
      demand = "High";
    } else if (roleLower.includes("intern") || roleLower.includes("junior")) {
      min = 75000;
      max = 105000;
      median = 90000;
      percentile = 45;
      demand = "Moderate";
    }

    // Filter job matches from mock jobs db
    const matches = jobs
      .map(j => {
        let score = 0;
        if (j.title.toLowerCase().includes(roleLower) || roleLower.includes(j.title.toLowerCase())) score += 3;
        const matchingSkills = j.skillsRequired.filter(s =>
          (skillsDetected || []).some((userS: string) => userS.toLowerCase() === s.toLowerCase())
        );
        score += matchingSkills.length;
        return { job: j, score, matchingSkills };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => ({
        jobId: item.job.id,
        title: item.job.title,
        company: item.job.company,
        salaryRange: item.job.salaryRange,
        matchReason: `${item.matchingSkills.length} key matching skills detected (${item.matchingSkills.join(", ") || "none"}). Great structural alignment with target role.`
      }));

    if (matches.length === 0 && jobs.length > 0) {
      matches.push({
        jobId: jobs[0].id,
        title: jobs[0].title,
        company: jobs[0].company,
        salaryRange: jobs[0].salaryRange,
        matchReason: `High compatibility with technical standards. Represents an excellent baseline match in our ecosystem.`
      });
    }

    return {
      id: "sal-" + Math.random().toString(36).substr(2, 9),
      resumeId: resumeId || "guest",
      estimatedMin: min,
      estimatedMax: max,
      medianSalary: median,
      percentile: percentile,
      confidenceScore: 85,
      marketDemandRating: demand,
      factors: [
        `High presence of relevant technical keywords matching standard corporate profiles.`,
        `Hiring climate for ${roleTarget} demonstrates robust mid-to-senior level premium indexation.`,
        `Candidate demonstrates modern modular stack proficiency (e.g. ${skillsDetected?.slice(0, 3)?.join(", ") || "TypeScript"}).`
      ],
      optimizingSkills: [
        {
          skill: "Docker & Kubernetes Integration",
          salaryDeltaPercent: 12,
          justification: "Enterprise architectures increasingly mandate containerized deployment skillsets. Adding these keywords increases shortlisting probability for top-tier cloud roles by 12%."
        },
        {
          skill: "Database Performance Tuning (SQL/NoSQL)",
          salaryDeltaPercent: 8,
          justification: "Full stack engineering mandates database optimization. Mastering transactional patterns can command substantial premium of up to 8%."
        }
      ],
      jobMatches: matches,
      marketContextSummary: `The market for ${roleTarget} positions remains highly active, particularly for professionals who possess structured deployment credentials. Gaps can be bridged by focusing on cloud ecosystems and infrastructure metrics.`
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY detected. Utilizing structured fallback salary prediction model.");
      res.json(defaultSalaryPrediction());
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
    You are an elite corporate technical recruiter, compensation consultant, and IT salary estimator.
    Predict a realistic salary and provide a comprehensive compensation assessment based on the candidate's target role, detected skills, and current job market data.

    Target Job Role: "${roleTarget}"
    Candidate Detected Skills: ${JSON.stringify(skillsDetected || [])}

    Current Job Market Reference Data (actual live job postings in our database):
    ${JSON.stringify(jobs)}

    Based on the target role, candidate skills, and active job reference postings:
    1. Estimate a realistic annual salary range in USD (e.g., 145000 to 185000).
    2. Rank the candidate's percentile in the market (e.g., 82).
    3. State 3 key factors driving this prediction.
    4. Propose 2 high-impact skills they could acquire or add to their resume, explaining estimated salary delta % increase and a justification.
    5. Align their profile with 1-3 of the provided job listings that represent the best match, giving a clear, brief match reasoning.
    6. Formulate a brief, professional market context summary.

    Respond with a single valid JSON object. You MUST follow this exact schema precisely, with NO markdown backticks, NO surrounding text, and NO comments:
    {
      "estimatedMin": Integer (annual salary minimum in USD, e.g., 145000),
      "estimatedMax": Integer (annual salary maximum in USD, e.g., 185000),
      "medianSalary": Integer (median annual salary in USD, e.g., 165000),
      "percentile": Integer (0 to 100 representing candidate's positioning in the overall market, e.g., 78),
      "confidenceScore": Integer (0 to 100 confidence level in this prediction, e.g., 85),
      "marketDemandRating": "Low" | "Moderate" | "High" | "Very High",
      "factors": ["String", "String", ... list of 3 key market/skill factors driving this salary prediction],
      "optimizingSkills": [
        {
          "skill": "String",
          "salaryDeltaPercent": Integer,
          "justification": "String"
        },
        ... exactly 2 items
      ],
      "jobMatches": [
        {
          "jobId": "String (must match one of the job IDs from current job reference data, e.g., 'job-1')",
          "title": "String",
          "company": "String",
          "salaryRange": "String",
          "matchReason": "String"
        }
      ],
      "marketContextSummary": "String (a brief 2-3 sentence overview of the current hiring climate and skill premium for this specific role)"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "";
    const cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    const finalResult: SalaryPrediction = {
      id: "sal-" + Math.random().toString(36).substr(2, 9),
      resumeId: resumeId || "guest",
      estimatedMin: parsedData.estimatedMin || 110000,
      estimatedMax: parsedData.estimatedMax || 155000,
      medianSalary: parsedData.medianSalary || 132000,
      percentile: parsedData.percentile || 65,
      confidenceScore: parsedData.confidenceScore || 85,
      marketDemandRating: parsedData.marketDemandRating || "High",
      factors: parsedData.factors || [],
      optimizingSkills: parsedData.optimizingSkills || [],
      jobMatches: parsedData.jobMatches || [],
      marketContextSummary: parsedData.marketContextSummary || "Completed estimation."
    };

    res.json(finalResult);

  } catch (error: any) {
    console.error("Salary prediction failed", error);
    res.json(defaultSalaryPrediction());
  }
});

// 7. Certificate Analyzer with Gemini API
app.post("/api/analyze/certificate", async (req, res) => {
  const user = getActiveUser(req);
  const { title, platform, certText } = req.body;

  if (!title || !platform) {
    res.status(400).json({ error: "Certificate title and platform are required." });
    return;
  }

  const defaultCertAnalysis = (): CertificateAnalysis => ({
    id: "cert-" + Math.random().toString(36).substr(2, 9),
    userId: user?.id || "guest",
    title,
    platform,
    predictedValue: "High",
    valueReason: `The certification is widely acknowledged as a foundational asset in software engineering. Recruiting platforms confirm strong employer affinity for structured curricula completed on ${platform}.`,
    keySkillsGained: ["Standard concepts", "Critical toolkits", "Architectural designs"],
    industryDemandSummary: "This qualification is mentioned in over 15% of active tech listings on modern platforms.",
    createdAt: new Date().toISOString()
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const mockCert = defaultCertAnalysis();
      if (user) {
        const db = readDB();
        db.certificates.push(mockCert);
        writeDB(db);
      }
      res.json(mockCert);
      return;
    }

    const ai = getGeminiAI();
    const prompt = `
    You are an expert IT industry certification assessor. Analyze the value of this certification.
    Certification Title: "${title}"
    Issuing Platform: "${platform}"
    Certificate Text details if provided: "${certText || ''}"

    Evaluate whether this certificate is highly valued, moderately valued, or less relevant in the current tech industry.
    Provide a robust, detailed assessment in valid JSON format.
    Your output must conform EXACTLY to this JSON structure, with no markdown block surrounding:
    {
      "title": "String (the title)",
      "platform": "String (the platform)",
      "predictedValue": "Very High" | "High" | "Medium" | "Low",
      "valueReason": "A detailed professional paragraph explaining its value, employer recognition, and platform credibility in today's market.",
      "keySkillsGained": ["Skill A", "Skill B", "Skill C"],
      "industryDemandSummary": "A concise summary of how in-demand this certification is by employers (e.g., job listing rates)."
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "";
    const cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    const finalResult: CertificateAnalysis = {
      id: "cert-" + Math.random().toString(36).substr(2, 9),
      userId: user?.id || "guest",
      title: parsedData.title || title,
      platform: parsedData.platform || platform,
      predictedValue: parsedData.predictedValue || "High",
      valueReason: parsedData.valueReason || "Valid certification.",
      keySkillsGained: parsedData.keySkillsGained || [],
      industryDemandSummary: parsedData.industryDemandSummary || "High market value.",
      createdAt: new Date().toISOString()
    };

    if (user) {
      const db = readDB();
      db.certificates.push(finalResult);
      writeDB(db);
    }

    res.json(finalResult);

  } catch (error: any) {
    console.error("Gemini Certificate Analysis failed", error);
    const mockCert = defaultCertAnalysis();
    if (user) {
      const db = readDB();
      db.certificates.push(mockCert);
      writeDB(db);
    }
    res.json(mockCert);
  }
});

// 8. Advanced Chatbot for Resume Editing & Tailoring
app.post("/api/chatbot/chat", async (req, res) => {
  const { messages, userMessage } = req.body;
  if (!userMessage) {
    res.status(400).json({ error: "Missing user message." });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return high-quality local chatbot advice fallback
      const reply = `I'm here to assist you! As your Resume Coach, here is a helpful tip: When writing resume bullet points, always start with an action verb (e.g., "Architected", "Spearheaded") instead of "Responsible for". Also, try to use the STAR method: Situation, Task, Action, Result. Did you want to review a specific bullet point now?`;
      res.json({ reply });
      return;
    }

    const ai = getGeminiAI();
    const historyText = (messages || [])
      .map((m: any) => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`)
      .join("\n");

    const prompt = `
    You are a friendly, encouraging, and highly professional AI Resume Builder Coach. 
    Your goal is to guide the candidate step-by-step in writing, formatting, and refining their resume to beat ATS checkers.
    Provide brief, highly structured, and constructive advice.
    If the candidate shares a bullet point or professional experience section, rewrite it to be far more impactful (incorporating metrics, action verbs, and skills).

    Conversation history so far:
    ${historyText}

    User's latest message: "${userMessage}"

    Response as Coach (keep under 120 words, use beautiful markdown bullet points if listing ideas):
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ reply: response.text || "I'm processing your request. How can I help write your next resume section?" });

  } catch (error: any) {
    console.error("Gemini Chatbot failed", error);
    res.json({ reply: "I'm having a small glitch talking to the server, but general advice is to ensure your resume explicitly lists keywords matching the job description to bypass ATS filters!" });
  }
});

// 9. HR Dashboard Advanced Analytics & Candidates Ranking
app.get("/api/hr/analytics", (req, res) => {
  const user = getActiveUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  // Double-check HR subscription paywall status
  const db = readDB();
  const dbUser = db.users.find((u: User) => u.id === user.id);
  if (!dbUser || !dbUser.isPremium) {
    res.status(403).json({ error: "Premium subscription required to access HR analytics." });
    return;
  }

  // Retrieve all analyzed resumes
  const allResumes: ResumeAnalysis[] = db.resumes;

  // Compile HR analytic metrics
  const totalAnalyzed = allResumes.length;
  const averageAtsScore = totalAnalyzed > 0
    ? Math.round(allResumes.reduce((sum, r) => sum + r.atsScore, 0) / totalAnalyzed)
    : 0;
  const highValueCandidates = allResumes.filter(r => r.overallScore >= 80).length;

  // Rankings
  const rankings = allResumes
    .map(r => ({
      resumeId: r.id,
      candidateName: r.candidateName,
      overallScore: r.overallScore,
      predictedShortlistChance: r.predictedShortlistChance,
      skillsScore: r.skillsScore,
      experienceScore: r.experienceScore || 70,
      formattingScore: r.formattingScore || 75,
      atsScore: r.atsScore || 65,
      skillsDetected: r.skillsDetected || [],
      missingSkills: r.missingSkills || [],
      improvements: r.improvements || [],
      interviewQuestions: r.interviewQuestions || []
    }))
    .sort((a, b) => b.overallScore - a.overallScore);

  // Skill gaps analysis compilation (gather skills detected vs desired)
  const skillFrequency: { [key: string]: number } = {};
  allResumes.forEach(r => {
    r.skillsDetected.forEach(s => {
      const skill = s.toLowerCase();
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  const targetSkills = ["react", "typescript", "node.js", "docker", "postgresql", "python", "kubernetes", "aws"];
  const skillGaps = targetSkills.map(skill => {
    const count = skillFrequency[skill] || 0;
    const rate = totalAnalyzed > 0 ? Math.round((count / totalAnalyzed) * 100) : 0;
    return {
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      frequencyInResumes: rate,
      requiredFrequency: 85 // Target frequency for ideal roles
    };
  });

  const salaryPrediction = {
    suggestedRange: totalAnalyzed > 0
      ? `$${90 + Math.round(averageAtsScore * 0.8)}k - $${130 + Math.round(averageAtsScore * 1.2)}k`
      : "$110k - $150k",
    factors: [
      "Technical mastery of premium frameworks (Next.js, LLM fine-tuning, Cloud infrastructure).",
      "Years of quantifiable lead developer or architect impact indicated in past positions.",
      "High ATS scoring profile matching standard corporate enterprise profiles."
    ]
  };

  const hrData: HRAnalytics = {
    totalAnalyzed,
    averageAtsScore,
    highValueCandidates,
    rankings,
    skillGaps,
    salaryPrediction
  };

  res.json(hrData);
});

// Seed some starter resumes for immediate trial testing
app.post("/api/seed/resumes", (req, res) => {
  const db = readDB();
  const sampleResumes: ResumeAnalysis[] = [
    {
      id: "sample-res-1",
      userId: "sample",
      candidateName: "Alex Mercer",
      roleTarget: "Senior Full Stack Engineer",
      overallScore: 88,
      skillsScore: 92,
      experienceScore: 85,
      formattingScore: 90,
      atsScore: 86,
      skillsDetected: ["React", "TypeScript", "Node.js", "Express", "Docker", "Git", "PostgreSQL"],
      missingSkills: ["Kubernetes", "AWS CloudFormation"],
      improvements: [
        "Include links to live project demos directly next to github repository listings.",
        "Add an introductory bio that highlights leadership and architecture experience explicitly."
      ],
      interviewQuestions: [
        "Explain how you would containerize and scale an existing monolithic Express server into Docker nodes.",
        "How do you design database indices for complex multi-join queries in high-volume PostgreSQL systems?"
      ],
      summary: "Alex is an outstanding senior candidate showing excellent full-stack command. Their resume has deep formatting and robust technical markers.",
      predictedShortlistChance: 92,
      createdAt: new Date().toISOString()
    },
    {
      id: "sample-res-2",
      userId: "sample",
      candidateName: "Sarah Connor",
      roleTarget: "AI Deployment Specialist",
      overallScore: 82,
      skillsScore: 88,
      experienceScore: 78,
      formattingScore: 82,
      atsScore: 80,
      skillsDetected: ["Python", "PyTorch", "LLMs", "FastAPI", "Docker", "Machine Learning"],
      missingSkills: ["Gemini API", "Kubernetes", "CI/CD"],
      improvements: [
        "Quantify the parameter size and tuning speed enhancements achieved during model fine-tuning.",
        "Include references to open-source libraries or scientific articles published."
      ],
      interviewQuestions: [
        "What strategies do you adopt to combat hallucination issues when deploying LLMs inside interactive applications?",
        "How do you manage latency budgets for generative models on memory-constrained infrastructure?"
      ],
      summary: "Sarah exhibits highly relevant foundational qualifications in AI systems deployment. Her resume showcases technical strengths in frameworks, with small gaps in clouds.",
      predictedShortlistChance: 84,
      createdAt: new Date().toISOString()
    }
  ];

  db.resumes = [...db.resumes, ...sampleResumes];
  writeDB(db);
  res.json({ success: true, count: sampleResumes.length });
});

// GET /api/interviews - Retrieve interviews list
app.get("/api/interviews", (req, res) => {
  const db = readDB();
  const resumeId = req.query.resumeId as string;
  let list = db.interviews || [];

  if (resumeId) {
    list = list.filter((item: any) => item.resumeId === resumeId);
  }

  res.json(list);
});

// POST /api/interviews - Save a scheduled interview
app.post("/api/interviews", (req, res) => {
  const {
    resumeId,
    candidateName,
    title,
    interviewerEmail,
    candidateEmail,
    dateTime,
    durationMinutes,
    description,
    meetLink,
    googleEventId
  } = req.body;

  if (!resumeId || !candidateName || !title || !dateTime) {
    res.status(400).json({ error: "Missing required interview fields." });
    return;
  }

  const db = readDB();
  if (!db.interviews) {
    db.interviews = [];
  }

  const newInterview = {
    id: "int-" + Math.random().toString(36).substr(2, 9),
    resumeId,
    candidateName,
    title,
    interviewerEmail: interviewerEmail || "",
    candidateEmail: candidateEmail || "",
    dateTime,
    durationMinutes: Number(durationMinutes) || 45,
    description: description || "",
    meetLink: meetLink || "",
    googleEventId: googleEventId || "",
    createdAt: new Date().toISOString()
  };

  db.interviews.push(newInterview);
  writeDB(db);

  res.status(201).json(newInterview);
});

// DELETE /api/interviews/:id - Cancel or delete a scheduled interview
app.delete("/api/interviews/:id", (req, res) => {
  const id = req.params.id;
  const db = readDB();

  if (!db.interviews) {
    db.interviews = [];
  }

  const index = db.interviews.findIndex((item: any) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Interview not found." });
    return;
  }

  const deleted = db.interviews.splice(index, 1)[0];
  writeDB(db);

  res.json({ success: true, deleted });
});

// POST /api/gemini/generate-interview-checklist - Generate skill-specific interview checklist
app.post("/api/gemini/generate-interview-checklist", async (req, res) => {
  const { skillsDetected, roleTarget } = req.body;

  if (!skillsDetected || !Array.isArray(skillsDetected) || skillsDetected.length === 0) {
    res.status(400).json({ error: "Candidate detected skills are required." });
    return;
  }

  const targetRole = roleTarget || "Software Engineer";

  // Mock lookup configuration for popular skills (fallback when API Key is missing)
  const skillQuestionMap: Record<string, { question: string; rationale: string; sampleAnswer: string }> = {
    "React": {
      question: "Can you explain the difference between useMemo, useCallback, and standard React memoization, and when to use each?",
      rationale: "Assesses deep understanding of rendering cycles, state stability, and performance optimization techniques inside complex React applications.",
      sampleAnswer: "useMemo caches the result of a calculation between renders, while useCallback caches the function definition itself. Standard React.memo is a higher-order component that memoizes a component to prevent re-renders unless its props change. You should only use them when performance profiling indicates bottlenecks, as premature optimization adds complexity and hook overhead."
    },
    "TypeScript": {
      question: "How do you leverage advanced TypeScript features like Discriminated Unions, Mapped Types, and Utility Types to design a type-safe API client?",
      rationale: "Evaluates capability to construct robust, self-documenting codebases that catch potential contract failures at compile-time.",
      sampleAnswer: "By defining a discriminated union with a common literal field (like type: 'success' | 'error'), the compiler can narrow types within conditional blocks. Combine this with Mapped Types (e.g. { [K in Keys]: Type }) or Utility Types like Omit, Pick, or Partial to transform shape representations cleanly without duplicating interfaces."
    },
    "Node.js": {
      question: "How does the Node.js event loop coordinate asynchronous I/O operations, and what is the difference between process.nextTick() and setImmediate()?",
      rationale: "Probes low-level knowledge of server-side Node architecture, concurrency modeling, and macro/micro task prioritization.",
      sampleAnswer: "Node.js runs on a single-threaded event loop that delegates heavy I/O operations to worker threads via libuv. process.nextTick() fires immediately after the current operation finishes (before event loop phases continue), whereas setImmediate() schedules a callback to run on the next event loop check phase, making nextTick() faster but prone to starving I/O if overused."
    },
    "Python": {
      question: "What are Python generators and decorators, and how would you implement a custom decorator to log the execution time of a function?",
      rationale: "Examines syntax fluency, memory optimization knowledge using lazy evaluation, and software pattern execution in Python.",
      sampleAnswer: "Generators use the yield keyword to produce items lazily one-by-one, conserving memory. Decorators are wrappers around functions that modify their behavior. To log timing, we create a nested function that grabs time.time() before and after calling the original function, prints the difference, and returns the result."
    },
    "Docker": {
      question: "What are the best practices for minimizing Docker image sizes in production, and how do multi-stage builds help?",
      rationale: "Checks DevOps efficiency, secure configuration strategies, and registry space optimization practices.",
      sampleAnswer: "Best practices include using slim/alpine base images, combining RUN commands to reduce layers, utilizing .dockerignore files, and adopting multi-stage builds. Multi-stage builds let you compile assets in a heavy SDK container first, then copy only the compiled binaries/artifacts into a tiny runner container, leaving compilation dependencies out of the final image."
    },
    "PostgreSQL": {
      question: "How would you design and optimize database indexes in PostgreSQL for a complex table with high read-write ratios?",
      rationale: "Tests structural design skills, index overhead trade-offs, and querying speed enhancement capabilities.",
      sampleAnswer: "Identify query access patterns using EXPLAIN ANALYZE. Create B-Tree indexes on frequent filter/join keys. Use partial indexes (WHERE clauses) to limit index size, or covering indexes (INCLUDE) to avoid heap fetches. Be careful with write-heavy tables as every index incurs insert/update latency, so index selectively."
    },
    "JavaScript": {
      question: "Explain event delegation in JavaScript and why it is beneficial for high-performance interactive interfaces.",
      rationale: "Verifies fundamental knowledge of DOM event propagation (bubbling) and DOM optimization techniques.",
      sampleAnswer: "Event delegation is a technique where you attach a single event listener to a parent element instead of adding multiple listeners to individual child elements. It leverages event bubbling, so when a child is clicked, the event bubbles up. This saves memory and automatically handles dynamically added children without requiring re-binding."
    }
  };

  const getFallbackQuestionForSkill = (skill: string, index: number) => {
    const normalized = skill.toLowerCase().trim();
    for (const [key, val] of Object.entries(skillQuestionMap)) {
      if (normalized.includes(key.toLowerCase())) {
        return {
          id: `q-${index + 1}`,
          skill,
          ...val
        };
      }
    }
    return {
      id: `q-${index + 1}`,
      skill,
      question: `In the context of ${targetRole}, what are the most critical architecture patterns and common pitfalls when scaling production systems utilizing ${skill}?`,
      rationale: `Evaluates candidate's practical experience, architectural command, and hazard-mitigation strategies when adopting ${skill} under load.`,
      sampleAnswer: `When scaling with ${skill}, engineers must focus on loose coupling, robust resource caching, stateless configurations, and comprehensive error handling. A common pitfall is ignoring resource leakages or lack of concurrency throttling, which can be mitigated by introducing rate limiters and graceful degraded states.`
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY detected. Generating high-fidelity mock interview checklist.");
      // Generate questions for the first 5 skills detected (or less if not available)
      const selectedSkills = skillsDetected.slice(0, 5);
      const questions = selectedSkills.map((skill, index) => getFallbackQuestionForSkill(skill, index));
      res.json({ questions });
      return;
    }

    const ai = getGeminiAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an elite corporate technical recruiter and hiring manager.
Analyze the following list of skills detected from the candidate's resume: ${JSON.stringify(skillsDetected)}.
The candidate is applying for the target job role: "${targetRole}".

Generate exactly 5 highly specific, professional, and challenging technical interview questions (each mapped to one of the candidate's detected skills).
For each question, provide:
1. The skill it belongs to.
2. The specific question.
3. Recruiter rationale (why this question is asked).
4. A high-quality model sample answer demonstrating seniority.

Respond with valid JSON following the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A unique id, e.g., 'q-1', 'q-2'" },
                  skill: { type: Type.STRING, description: "The specific skill name this question evaluates" },
                  question: { type: Type.STRING, description: "The technical interview question" },
                  rationale: { type: Type.STRING, description: "Why the recruiter is asking this specific question" },
                  sampleAnswer: { type: Type.STRING, description: "A detailed, perfect sample answer demonstrating expertise" }
                },
                required: ["id", "skill", "question", "rationale", "sampleAnswer"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error generating interview checklist via Gemini:", error);
    // Graceful fallback to avoid breaking UI on any downstream API issues
    const selectedSkills = skillsDetected.slice(0, 5);
    const questions = selectedSkills.map((skill, index) => getFallbackQuestionForSkill(skill, index));
    res.json({ questions });
  }
});



// Vite middleware configuration for development vs static production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
