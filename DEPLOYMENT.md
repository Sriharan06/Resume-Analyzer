# Deployment Guide: AI Resume Analyzer & Recruitment Dashboard

This guide explains how to deploy the AI Resume Analyzer application to cloud platforms like **Render** or **Railway**. 

The application is structured as a full-stack Node.js & React app. In production:
1. **Frontend**: Vite compiles React into static assets inside the `dist` directory.
2. **Backend**: `esbuild` compiles `server.ts` into a production-ready CommonJS file (`dist/server.cjs`).
3. **Serving**: The Express server serves both the API endpoints (`/api/*`) and the compiled static React frontend.

---

## 🛠️ Build and Run Scripts

The application has the following predefined scripts in [package.json](file:///d:/Resume%20Analyzer/package.json):
*   **Build**: `npm run build` (runs Vite build and bundles the server code into `dist/server.cjs`).
*   **Start**: `npm start` (runs the bundled server in production: `node dist/server.cjs`).

---

## 🔑 Required Environment Variables

When deploying, make sure to set the following Environment Variables in your hosting dashboard:

| Variable Name | Required | Description / Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | Set to `production` to serve build files and enable production behaviors. |
| `PORT` | Yes | The port the application binds to (automatically assigned by Render/Railway). |
| `GEMINI_API_KEY` | Yes (Recommended) | Your Google Gemini API Key. (Falls back to local mock responses if omitted). |
| `APP_URL` | No | The public URL of your deployed application (e.g. `https://resume-analyzer.onrender.com`). |
| `LINKEDIN_CLIENT_ID` | No | LinkedIn OAuth App ID (only needed for live LinkedIn job sync). |
| `LINKEDIN_CLIENT_SECRET`| No | LinkedIn OAuth Secret. |

---

## 📦 Option 1: Deploying on Render (Recommended)

Render is a modern cloud provider with a generous free tier that supports Node.js web services.

### Step 1: Create a Web Service
1. Log in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository `https://github.com/Sriharan06/Resume-Analyzer.git`.

### Step 2: Configure Settings
Use the following settings in the Render setup:
*   **Language**: `Node`
*   **Branch**: `main`
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm start`

### Step 3: Add Environment Variables
Click on the **Environment** tab and add:
*   `NODE_ENV`: `production`
*   `GEMINI_API_KEY`: `your_actual_gemini_api_key`
*   `APP_URL`: `https://your-service-name.onrender.com`

### Step 4: (Optional but Recommended) Persistent Storage for `db.json`
Since this application uses a local JSON file (`db.json`) as a database, standard deployments on Render are ephemeral (data is lost when the web service restarts or redeploys).
To persist candidate profiles, resume analyses, and interview details:
1. Scroll down to the **Disks** section in Render.
2. Click **Add Disk**.
3. Name: `db-storage`
4. Mount Path: `/var/data`
5. Size: `1 GB` (free)
6. Add an environment variable to point your database to this persistent volume. (Note: Currently the application writes `db.json` to the current working directory. For absolute permanence, you can mount the disk directly to the working directory or use the `/var/data` mount).

---

## 🚀 Option 2: Deploying on Railway

Railway is another developer-friendly platform that makes full-stack deployment effortless.

### Step 1: Create Project
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `Resume-Analyzer`.

### Step 2: Configure Environment Variables
In the **Variables** tab of your service, add:
*   `NODE_ENV`: `production`
*   `GEMINI_API_KEY`: `your_actual_gemini_api_key`
*   `APP_URL`: `${{RAILWAY_STATIC_URL}}` (Railway automatically populates this with your public URL).

### Step 3: Verify Service Settings
Railway automatically detects the `package.json` scripts and runs `npm run build` followed by `npm start`. Ensure the Start Command is set to `npm start`.

---

## 💾 Notes on the Local Database (`db.json`)
The application uses a lightweight local JSON file (`db.json`) for data storage. 
*   **On Free/Serverless hosting**: File storage is ephemeral. Redepolys or restarts will reset the database back to its default state.
*   **For production scaling**: It is recommended to migrate the storage logic in `server.ts` to a persistent database such as **Firebase Firestore**, **MongoDB**, or **PostgreSQL** if long-term data persistence is required.
