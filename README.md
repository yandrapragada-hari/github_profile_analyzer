# 🚀 GitHub Profile Analyzer (Fullstack Monorepo)

A professional full-stack web application that fetches GitHub profiles, runs analytical scoring, stores insights in MySQL, compares developers, tracks growth history, and visualizes profile data.

Built specifically for the internship evaluation assignment.

## 📂 Project Structure (Monorepo)
The project is structured as a monorepo containing:
- **`backend/`**: Node.js & Express API, database access layers, and GitHub integration.
- **`frontend/`**: Vite + React + Vanilla CSS + Lucide Icons developer dashboard.

---

## ✨ Features

### 1. Core Profile Analytics
- **Fetch & Store Insights**: Fetch profile metadata and repository metrics (followers, repos, stars, main languages) from GitHub using the public API.
- **Dynamic Scoring**: Computes a custom GitHub score for profiles.
- **Local Database Upsert**: Stores results in MySQL with automatic duplicate updates on re-analysis.

### 2. Developer Badge System
Categorizes developers into ranks based on their GitHub score:
- 🥉 **Beginner**: Score < 50
- 🥈 **Intermediate**: Score 50 - 500
- 🥇 **Advanced**: Score 500 - 5000
- 🏆 **GitHub Star**: Score > 5000

### 3. Profile Comparison
- Compare two developers' followers, repositories, stars, and overall score in a neat UI grid, highlighting the winner for each metric.

### 4. Growth History Tracking
- Keeps a log of historical scans in `profile_history` to track growth changes over time, displaying a timeline with relative change indicators (e.g. `+10 followers`, `-5 points`).

### 5. Refresh & Export
- **Data Refresh**: Trigger a data refresh via `PUT /api/profiles/:username/refresh`.
- **Export Utility**: Download profile insights in **JSON** or **CSV** formats directly from the UI.

### 6. Premium UI & Mobile Responsive Design
- Clean, gorgeous Royal Blue theme utilizing the **Inter** font face.
- Completely mobile responsive, with flexible flexbox wrapping and scrollable container safety for comparison data grids.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, MySQL (mysql2/promise), Axios, Cors, Helmet
- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS

---

## ⚙️ Local Setup Instructions

### 1. Requirements
- Node.js 18+
- MySQL Server

### 2. Database Configuration
1. Start your local MySQL server.
2. The backend will **automatically initialize the required tables (`github_profiles`, `profile_history`) on startup**, so you do not need to run manual schema files. Just ensure the database exists.

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Configure database connection parameters or use `DATABASE_URL` in `.env`:
   ```env
   PORT=3000
   DATABASE_URL=mysql://root:password@localhost:3306/github_profile_analyzer
   DB_SSL=false
   ```
5. Run the backend:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Vite dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment & Production Setup

This application is fully prepared for modern cloud hosting services (e.g. Render, Railway).

### Backend Web Service Setup (e.g., Render)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `DATABASE_URL`: Connection string of your production database.
  - `DB_SSL`: `true` (if SSL is required by your database provider).
  - `GITHUB_TOKEN`: Add a GitHub Personal Access Token (PAT) to bypass the default 60 requests/hour unauthenticated API rate limit (increases it to 5000/hour).

### Frontend Static Site Setup (e.g., Render/Vercel)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of your deployed backend service (e.g., `https://your-backend.onrender.com`).

---

## 📡 API Reference

### Profiles
- `POST /api/profiles/:username` - Fetch, analyze, and save a profile.
- `GET /api/profiles` - Get all stored profiles (sorted by score).
- `GET /api/profiles/:username` - Get detailed data of a single profile.
- `PUT /api/profiles/:username/refresh` - Re-fetch latest GitHub data and update database.
- `GET /api/profiles/:username/history` - Retrieve history of scans.
- `GET /api/profiles/:username/export?format=csv|json` - Export user data.

### Comparison & Stats
- `GET /api/compare/:user1/:user2` - Compare two profiles.
- `GET /api/stats` - Retrieve aggregate statistics.
