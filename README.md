<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AI Resume Analyzer & Recruitment Dashboard

An advanced, AI-powered platform for resume analysis, certificate validation, personalized job matching, and HR analytics. Powered by Google Gemini AI and built with a modern React and Node.js full-stack architecture.

🔗 **Live Deployment:** [https://resume-analyzer-kdb4.onrender.com/](https://resume-analyzer-kdb4.onrender.com/)

View your app in AI Studio: https://ai.studio/apps/91fe693b-2658-4bb3-9e30-bb2d8813b1a8

---

## 🚀 Tech Stack

### Frontend
- **Framework & Core**: React 19, TypeScript
- **Bundler & Build Tool**: Vite
- **Styling & Motion**: TailwindCSS (v4) & Framer Motion (smooth, high-fidelity micro-interactions and transitions)
- **Data Visualization**: D3.js (custom interactive candidate competency radar charts and dashboard graphics)
- **Authentication**: Firebase Authentication (Google OAuth provider)
- **PDF Generation**: jsPDF (for exporting comprehensive resume reports)
- **File Handling**: React Dropzone (drag-and-drop resume/certificate uploading)
- **Icons**: Lucide React
- **Google Calendar Integration**: Client-side OAuth using Google Calendar API (`v3`) to schedule, synchronize, and manage interviews directly from the dashboard with automated Google Meet video links.

### Backend
- **Server Framework**: Node.js, Express, TypeScript (executed with `tsx`)
- **LLM/AI Integration**: Google Gen AI SDK (`@google/genai` v2.4.0) using the state-of-the-art `gemini-3.5-flash` model.
- **Database/Persistence**: Local JSON database (`db.json`) functioning as a local mock database.
- **Production Bundler**: esbuild
- **OAuth & API Integrations**:
  - **LinkedIn OAuth & Jobs API**: For fetching candidate profile summaries and personalizing job recommendations with Gemini AI.
  - **GitHub API**: For connecting developer profiles and pulling repositories.
  - **Google OAuth**: Helper proxy routes.

---

## 🔑 Environment Variables & API Configuration

To run this application locally, you will need to configure environment variables and credential files:

### 1. Environment Variables (`.env.local` / `.env`)
Create a `.env.local` or `.env` file in the root directory. You can use `.env.example` as a template:

```env
# Google Gemini API Key (Required for AI features)
GEMINI_API_KEY="your_gemini_api_key_here"

# Application hosting URL (Self-referential links & callbacks)
APP_URL="http://localhost:3001"

# LinkedIn OAuth credentials for Job Recommendations
LINKEDIN_CLIENT_ID="your_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
```

### 2. Firebase Credentials Configuration
Ensure `firebase-applet-config.json` is configured in the root directory. This contains client credentials for the Firebase project used in Google Authentication:
```json
{
  "projectId": "academic-legend-7w1xt",
  "appId": "1:259998614420:web:8c862d6ae84e174e894581",
  "apiKey": "AIzaSyBkwZsXcDYc1_9xDZ-7f77RqLLKKcta95M",
  "authDomain": "academic-legend-7w1xt.firebaseapp.com",
  "storageBucket": "academic-legend-7w1xt.firebasestorage.app",
  "messagingSenderId": "259998614420",
  "measurementId": ""
}
```

---

## 🛠️ Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
Install all package dependencies for the frontend and backend:
```bash
npm install
```

### 2. Start the Development Server
Run the local dev server (spins up Vite and Express backend concurrently):
```bash
npm run dev
```

The application will run locally, and you can open the development port shown in your terminal (typically `http://localhost:3001`).
