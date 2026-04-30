# AutoSocial Manager - Setup & Deployment Guide

This project is an automated social media manager that fetches trends, generates content using Gemini AI, and creates branded images.

## Architecture
- **Backend**: Express (Node.js) with SQLite (better-sqlite3)
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **AI**: Google Gemini API (via `@google/genai`)
- **Image Engine**: Sharp (Node.js)
- **Scheduler**: Node-cron

## Folder Structure
- `/src`: React Frontend
- `/server`: Express Backend logic
- `/server/db.ts`: Database schema and initialization
- `/server/services`: News, Content, and Image services
- `/data/generated`: Persistent storage for generated social media images

## Setup Guide (Local)

1. **Prerequisites**:
   - Node.js (v18+)
   - A Google Gemini API Key

2. **Environment Variables**:
   Create a `.env` file (or use secrets in AI Studio):
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment Guide (Cloud)

### 1. Google Cloud Run (Recommended)
This app is designed to run in a container on Cloud Run.

1. **Build Image**:
   ```bash
   gcloud builds submit --tag gcr.io/your-project/autosocial
   ```

2. **Deploy**:
   ```bash
   gcloud run deploy autosocial \
     --image gcr.io/your-project/autosocial \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_key"
   ```

### 2. Manual VPS Deployment (Ubuntu/Nginx)
1. Clone the repository on your server.
2. Install dependencies: `npm install`.
3. Build the frontend: `npm run build`.
4. Set up PM2 to keep the server running:
   ```bash
   pm2 start tsx -- server.ts --name autosocial
   ```
5. Configure Nginx as a reverse proxy to port 3000.

## Notes on Social Media APIs
To move from "Simulated" to "Production" posting:
1. Obtain Developer access for **Twitter (X) API** and **Instagram Graph API**.
2. Update `/server/scheduler.ts` to include your API client logic (e.g., using `twitter-api-v2` and `axios` for Meta API).
3. The image generation engine is already production-ready using high-performance `sharp`.
