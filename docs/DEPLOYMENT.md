# THE ALOA V3 — DEPLOYMENT & INFRASTRUCTURE GUIDE

This guide details the complete deployment process for **THE ALOA V3** on **Vercel (Frontend)**, **Render (Backend)**, and custom domain routing for **aloav3.com**.

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE                          │
│     Next.js 14 Web Application (App Router)             │
│     Primary Domain: https://aloav3.com                  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST / SSE
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    RENDER WEB SERVICE                   │
│     FastAPI Python Backend (Uvicorn)                    │
│     Backend Domain: https://api.aloav3.com              │
│     • DeviceManager: Ephemeral In-Memory Pairing        │
│     • AI Orchestrators: Groq, Gemini, Claude            │
│     • Cloud Healer, YouTube Notes, Resume Engine        │
└───────────────────────────▲─────────────────────────────┘
                            │ Outbound Encrypted WebSocket (WSS)
                            │ Port 443 (No Router Port-Forwarding Needed)
┌───────────────────────────┴─────────────────────────────┐
│                 USER'S WINDOWS LAPTOP                   │
│     ALOA Companion Agent (aloa-agent.exe)               │
│     • Displays 6-character dynamic pairing code         │
│     • Prompts user for local security approval          │
│     • Executes Winget, System Diagnostics, Code Repair  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND DEPLOYMENT (VERCEL)

### Step 1: Connect GitHub Repository
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import GitHub repository: `https://github.com/thepeeyushyadav/THE-ALOA`.
4. Select branch: `development/aloa-v3` (or `main` when approved).

### Step 2: Configure Project Settings
- **Framework Preset:** `Next.js`
- **Root Directory:** Edit &rarr; select `frontend`
- **Build Command:** `next build` (default)
- **Output Directory:** `.next` (default)

### Step 3: Environment Variables
Add the following in Vercel **Environment Variables**:
- `NEXT_PUBLIC_API_URL`: `https://api.aloav3.com`

### Step 4: Click Deploy
Vercel will compile the Next.js production build and assign a deployment URL (e.g. `https://aloa-v3.vercel.app`).

---

## 3. BACKEND DEPLOYMENT (RENDER)

### Step 1: Create New Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** &rarr; **"Web Service"**.
3. Connect your GitHub repository `THE-ALOA` (Branch: `development/aloa-v3`).

### Step 2: Configure Service Parameters
- **Name:** `aloa-v3-backend`
- **Region:** `Oregon (US West)` or `Frankfurt (EU)`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements-cloud.txt`
- **Start Command:** `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
- **Instance Type:** `Free`

### Step 3: Environment Variables
In the Render **Environment** tab, configure:
| Key | Example / Description |
|---|---|
| `PYTHON_VERSION` | `3.10.12` |
| `ALLOWED_ORIGINS` | `https://aloav3.com,https://www.aloav3.com,https://aloa-v3.vercel.app,http://localhost:3000` |
| `GROQ_API_KEY` | Your Groq API key for Llama 3.3 inference |
| `GEMINI_API_KEY_1` | Google Gemini API key for Code Healer & YouTube Notes |
| `GEMINI_API_KEY_2` | Backup Google Gemini key |
| `OPENROUTER_API_KEY` | OpenRouter key (optional fallback) |

---

## 4. DOMAIN DNS CONFIGURATION (aloav3.com)

Configure DNS records with your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

### Record 1: Frontend Apex Domain (`aloav3.com`)
- **Type:** `A`
- **Name / Host:** `@`
- **Value / Points to:** `76.76.21.21` (Vercel Anycast IP)
- **TTL:** Automatic or 3600

### Record 2: Frontend WWW Subdomain (`www.aloav3.com`)
- **Type:** `CNAME`
- **Name / Host:** `www`
- **Value / Points to:** `cname.vercel-dns.com.`
- **TTL:** Automatic or 3600

### Record 3: Backend API Subdomain (`api.aloav3.com`)
- **Type:** `CNAME`
- **Name / Host:** `api`
- **Value / Points to:** `<your-render-subdomain>.onrender.com` (copy from Render Web Service dashboard)
- **TTL:** Automatic or 3600

---

## 5. VERIFICATION CHECKLIST

- [ ] `https://aloav3.com` loads the Next.js landing page over HTTPS.
- [ ] `https://api.aloav3.com/api/health` returns `{"status":"online","agent":"ALOA V3"}`.
- [ ] In the web navbar, clicking **"Connect Laptop"** opens the pairing dialog.
- [ ] Launching `aloa-agent.exe` on Windows displays a 6-character code.
- [ ] Entering the code pairs the session and turns the navbar indicator green.
