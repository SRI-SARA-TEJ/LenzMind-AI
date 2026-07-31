# 🎬 LensMind AI

### Five AI Agents. One Creative Workspace. Zero Context-Switching.

> **IBM AI Builders Challenge 2026 — July Challenge**
> Challenge Theme: *Reimagine Creative Industries with AI*

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)
![IBM Bob](https://img.shields.io/badge/Built%20with-IBM%20Bob-0f62fe)

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Challenge Theme](#-selected-challenge-theme)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [The Five AI Agents](#-the-five-ai-agents)
- [AI Architecture](#-ai-architecture)
- [Core Principles](#-core-principles)
- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [System Architecture](#️-system-architecture)
- [How IBM Bob Was Used](#-how-ibm-bob-was-used)
- [IBM SkillsBuild](#-ibm-skillsbuild-learning)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Demo Video](#-demo-video)
- [Live Application](#-live-application)
- [Real-World Impact](#-real-world-impact)
- [Innovation](#-innovation)
- [Future Improvements](#-future-improvements)
- [Challenge Submission](#-ibm-ai-builders-challenge-submission)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 📌 Project Overview

**LensMind AI** is an AI-powered creative workspace that gives content creators a team of five specialized Google Gemini AI agents — all in one platform.

Instead of jumping between separate tools to review footage quality, plan edits, write captions, analyze performance, and learn from past work, LensMind AI brings five specialized AI agents into a single unified workspace where they collaborate on every creative project.

Upload your content. LensMind's agents get to work — analyzing, advising, and personalizing — while you stay in full control of every decision.

LensMind AI was developed for the **IBM AI Builders Challenge 2026 — July Challenge**, using **IBM Bob** as the primary AI-assisted development tool across every phase of the software development lifecycle.

> **The goal is not to replace the creator's vision.**
> The goal is to give every creator an intelligent AI team that works alongside them — analyzing, advising, and learning — so they can focus entirely on creating.

---

## 🎯 Selected Challenge Theme

### Reimagine Creative Industries with AI

Creative industries are driven by imagination and expression — but the creative process is often slowed down by fragmented tools, repetitive technical decisions, and the challenge of turning raw footage into polished, publish-ready content.

LensMind AI directly addresses this challenge by deploying five specialized AI agents that handle the analytical and advisory layers of creative production, freeing creators to focus on what they do best.

The platform demonstrates how AI can:
- Act as a **creative partner**, not just a content generator
- **Analyze and advise** across multiple dimensions simultaneously
- **Learn from a creator's decisions** over time to give increasingly personalized guidance
- Bridge the gap between **raw content and publish-ready output**

---

## ❗ Problem Statement

Content creators working with photo and video face a fragmented workflow.

After capturing content, a creator typically needs to:

- Evaluate the technical quality of their footage (sharpness, exposure, noise, composition)
- Decide how to edit it (brightness, contrast, crop, colour grade)
- Figure out what captions, hashtags, and platforms will maximize reach
- Track performance and understand what is actually working
- Manually remember what types of advice they accepted or dismissed in past projects

These tasks require different types of expertise and are typically handled by separate, disconnected tools.

The challenge is therefore not simply:

> *"How can AI generate content?"*

The larger challenge is:

> *"How can AI analyze multiple creative dimensions simultaneously, advise with explanation and confidence scores, learn from a creator's history, and deliver all of this through one unified workspace — while keeping the creator in complete control?"*

---

## 💡 Solution

LensMind AI introduces a **five-agent AI creative workspace** where specialized agents collaborate on every project.

```
        YOUR CONTENT
             │
             ▼
    ┌─────────────────────┐
    │   LensMind AI       │
    │   Workspace         │
    └────────┬────────────┘
             │
    ┌────────▼────────────────────────────────────────┐
    │         FIVE AI AGENTS (Google Gemini AI)         │
    │                                                  │
    │  📷 Camera Intelligence  →  Technical Quality    │
    │  ✂️  Editing Intelligence  →  Post-Production     │
    │  📣 Content Optimization  →  Publishing Strategy │
    │  📊 Analytics             →  Performance Trends  │
    │  🧠 Creator Memory        →  Personalised Advice │
    └────────┬────────────────────────────────────────┘
             │
             ▼
    EXPLAINABLE RECOMMENDATIONS
    (Accept · Dismiss · Every decision is yours)
```

Every recommendation generated by LensMind AI includes:
- A human-readable **explanation** (AI must always explain itself)
- A **confidence score** (0.0–1.0)
- A **userAction** field — `accepted` or `dismissed` (human stays in control)
- **Tags** for filtering and grouping

---

## 🤖 The Five AI Agents

| # | Agent | Powered By | Responsibility |
|---|-------|-----------|----------------|
| 1 | 📷 **Camera Intelligence Agent** | Google Gemini 1.5 Flash (Vision) | Analyzes photo/video technical quality — sharpness, exposure, noise, composition. Returns an overall score with per-dimension breakdowns and one actionable improvement. |
| 2 | ✂️ **Editing Intelligence Agent** | Google Gemini 1.5 Flash (Text) | Generates structured post-production editing recommendations — brightness, contrast, crop, colour grade, sharpness, and workflow advice. `requiresApproval: true` always. |
| 3 | 📣 **Content Optimization Agent** | Google Gemini 1.5 Flash (Text) | Produces publishing strategy recommendations — ready-to-use captions, keywords, hashtags, primary platform selection, engagement advice, and posting timing. |
| 4 | 📊 **Analytics Agent** | Google Gemini 1.5 Flash *(roadmap)* | Tracks content performance metrics and identifies patterns across a creator's projects. Surfaces predictive insights ("posts on Tuesday get 40% more reach"). |
| 5 | 🧠 **Creator Memory Agent** | Google Gemini 1.5 Flash (Text) | The only **cross-project agent** — analyzes the creator's full decision history (accepted/dismissed recommendations) to surface personalized guidance that improves with every project. |

---

## 🧠 AI Architecture

```
        USER
          │
          ▼
  React + Vite Frontend
          │
      REST API
          │
          ▼
  Express.js Backend
          │
  Agent Orchestrator
          │
  ┌───────┼──────────────────────────────┐
  ▼       ▼       ▼         ▼            ▼
Camera  Editing  Content  Analytics  Creator
Intel.  Intel.   Optim.   Agent      Memory
  │       │       │         │            │
  ▼       ▼       ▼         ▼            ▼
gemini-  gemini-  gemini-  (roadmap) gemini-
flash    flash    flash               flash
  │       │       │                    │
  └───────┴───────┴────────────────────┘
          │
          ▼
  Recommendation Service
  (title · explanation · confidence · tags · userAction)
          │
          ▼
     MongoDB Atlas
```

**One Google Gemini model handles everything:**
- `gemini-1.5-flash` — Camera Intelligence (vision), Editing, Content Optimization, Creator Memory (text)
- Free tier: 15 requests/minute, 1500 requests/day — no credit card required

**Mock mode:** When `GEMINI_API_KEY` is not set, every agent returns a clearly labelled mock response (`status: 'mock'`) so the full stack runs end-to-end without credentials — ideal for local development.

---

## 🏛️ Core Principles

```
Specialized AI Agents
        +
Google Gemini AI (Right model for the right task)
        +
Explainable Recommendations
        +
Human Control (Accept · Dismiss · Always)
        =
Professional Creative Production
```

These principles are **enforced in code**:

| Principle | Where enforced |
|-----------|----------------|
| AI assists, never replaces | Every recommendation has Accept + Dismiss buttons |
| Users stay in control | `userAction` field on every Recommendation document |
| AI must explain itself | `explanation` field is **required** in the Recommendation model |
| No fake AI | Agents return `status: 'mock'` — never hardcoded fake data |
| Right model, right job | Vision model for Camera agent · Text model for language tasks |

---

## ✨ Key Features

**AI Features**
- 📷 Camera technical quality analysis (sharpness, exposure, noise, composition)
- ✂️ Structured post-production editing recommendations
- 📣 Platform-aware content publishing strategy (captions, hashtags, timing)
- 📊 Performance analytics and trend identification *(roadmap)*
- 🧠 Cross-project creator memory and personalized guidance

**Creator Features**
- Upload photo and video assets per project
- Review AI recommendations with full explanations
- Accept or dismiss each recommendation individually
- Dashboard overview of projects, assets, and recommendations
- Workspace per project with AI agent results

**Platform Features**
- Versioned REST API (`/api/v1/`)
- Responsive single-page application
- CSS custom property design system (IBM Carbon–ready)
- Mock mode — works fully without IBM credentials (local dev)
- MongoDB schema designed for zero-migration AI output expansion

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6, CSS Modules |
| **Backend** | Node.js 18+, Express 4, Nodemon |
| **Database** | MongoDB, Mongoose ODM |
| **AI** | Google Gemini 1.5 Flash (free tier) — vision + text in one model |
| **File Upload** | Multer (multipart/form-data) |
| **Dev Tools** | IBM Bob, VS Code, Git, GitHub |
| **Deployment** | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│                   USER                      │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           REACT + VITE FRONTEND             │
│                                             │
│  Dashboard · Upload · Workspace             │
│  Recommendations · Analytics                │
└─────────────────────┬───────────────────────┘
                      │
                   REST API
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           EXPRESS.JS BACKEND API            │
│                                             │
│  Projects · Uploads · Recommendations       │
│  AI Agents · Analytics · Health             │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐   ┌──────────────────┐
│ Google       │   │   MongoDB Atlas  │
│ Gemini Flash │   │  Projects        │
│ Vision + Text│   │  Recommendations │
└──────────────┘   └──────────────────┘
```

---

## 🔷 How IBM Bob Was Used

IBM Bob served as the **primary AI-assisted development tool** throughout the entire development of LensMind AI — across every phase of the software development lifecycle.

### 🗺️ Project Planning
IBM Bob assisted with:
- Designing the five-agent AI architecture
- Defining the agent orchestration pattern
- Planning the MongoDB schema for AI output expansion
- Structuring the versioned REST API surface

### 💻 Code Generation & Development
IBM Bob supported the development of:
- All five AI agent classes with Google Gemini AI integration
- Agent orchestrator and recommendation service
- Express.js REST API routes and controllers
- React frontend pages, components, and routing
- CSS design token system and responsive layout

### 🐛 Debugging
IBM Bob was used to identify and resolve issues involving:
- Google Gemini AI integration and mock fallback logic
- MongoDB connection and Mongoose model validation
- Multer file upload middleware configuration
- React Router navigation and component state

### 🎨 UI/UX Refinement
IBM Bob provided suggestions to improve:
- Dashboard layout and StatCard component design
- Recommendation card UX (accept/dismiss pattern)
- Responsive sidebar and top bar navigation

### ✅ Testing & Validation
IBM Bob assisted with:
- Verifying agent mock mode works without credentials
- API endpoint testing and response shape validation
- Frontend-to-backend integration verification

IBM Bob was used not only for code generation but as a **collaborative development partner** across understanding, planning, building, debugging, testing, and refining the entire application.

---

## 🎓 IBM SkillsBuild Learning

As part of the IBM AI Builders Challenge requirements, the required IBM SkillsBuild learning activity was completed by every team member.

**Completed Learning Activity:**
> *Lab: Troubleshoot Your Code Using IBM Bob*

This lab provided hands-on practical experience with AI-assisted code troubleshooting, debugging workflows, and how IBM Bob supports the full software development lifecycle. Completed and submitted through the official IBM AI Builders Challenge platform.

The completion certificate has been retained and submitted as part of the official challenge submission.

---

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- **Git**
- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier
- **Google AI Studio account** + **Gemini API key** *(optional — mock mode works without it, get free key at [aistudio.google.com](https://aistudio.google.com/app/apikey))*

### 1. Clone the Repository

```bash
git clone https://github.com/SRI-SARA-TEJ/LenzMind-AI.git
cd LenzMind-AI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the environment file:

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

> ⚠️ **Never commit your `.env` file, API keys, or database credentials to GitHub.**

Configure your `.env` — at minimum set `MONGODB_URI`. Gemini AI credentials are optional (mock mode activates automatically when unset):

```
MONGODB_URI=mongodb://localhost:27017/lensmind
PORT=5000
```

Start the backend:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`
Health check: `http://localhost:5000/api/v1/health`

### 3. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Environment Variables

> ⚠️ **Security reminder:** Never commit `.env` files, API keys, JWT secrets, or database passwords to your public GitHub repository.

All required variables are documented in [`backend/.env.example`](backend/.env.example).

### Backend — Required

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `MAX_FILE_SIZE` | Max upload size in bytes (default: 100 MB) |
| `UPLOAD_DIR` | Local upload folder (default: `uploads`) |

### Backend — Google Gemini AI *(optional — mock mode if unset)*

Get your free API key at: https://aistudio.google.com/app/apikey

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key (free — no card required) |
| `GEMINI_MODEL` | Model override (default: `gemini-1.5-flash`) |
| `GEMINI_TIMEOUT_MS` | Request timeout in ms (default: `30000`) |
| `GEMINI_MAX_RETRIES` | Max retry attempts on transient errors (default: `2`) |

---

## 📡 API Endpoints

All routes are prefixed with `/api/v1/`

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check and status |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create a new project |
| `GET` | `/projects/:id` | Get a single project |
| `PUT` | `/projects/:id` | Update project fields |
| `DELETE` | `/projects/:id` | Delete a project |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/uploads` | Upload a media file (multipart/form-data) |

### AI & Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/analyze-image` | Trigger Camera Intelligence Agent on an asset |
| `GET` | `/recommendations/:projectId` | Get all AI recommendations for a project |
| `PATCH` | `/recommendations/:id/action` | Accept or dismiss a recommendation |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics` | Get platform analytics data |

---

## 📁 Project Structure

```
ai-creator-os/
│
├── backend/
│   ├── agents/
│   │   ├── cameraIntelligence/    Gemini Vision — technical quality analysis
│   │   ├── editingIntelligence/   Gemini Text   — post-production suggestions
│   │   ├── contentOptimization/   Gemini Text   — publishing strategy
│   │   ├── analytics/             Roadmap — performance trend analysis
│   │   └── creatorMemory/         Gemini Text   — cross-project personalization
│   │
│   ├── config/                    Database and storage configuration
│   ├── controllers/               HTTP request handlers
│   ├── middleware/                Error handling, logging, async wrapper
│   ├── models/
│   │   ├── Project.js             Project schema (assets, AI output fields)
│   │   └── Recommendation.js      AI recommendation schema (explanation required)
│   ├── routes/                    Versioned REST API routes
│   ├── services/                  Business logic (AI, recommendations, uploads)
│   ├── server.js                  Application entry point
│   └── .env.example               Environment variable template
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/            AppLayout, Sidebar, TopBar
        │   └── ui/                StatCard, ProjectCard, RecommendationCard, Toast
        ├── context/               AppContext (global state)
        ├── pages/                 Dashboard, Upload, Workspace, Recommendations, Analytics
        ├── services/              API client
        └── styles/                Global CSS design tokens
```

---

## 📸 Screenshots

> Screenshots of the completed LensMind AI application are available in the `screenshots/` directory.

| Screen | Description |
|--------|-------------|
| Landing / Dashboard | Project overview with stats |
| Upload Page | Media asset upload interface |
| Workspace | Per-project view with AI agent results |
| Recommendations | Accept / Dismiss AI recommendations |
| Analytics | Performance dashboard |

---

## 🎥 Demo Video

**Public Demo Video:**  
https://youtu.be/uwvytN99VpU?si=q3Irog0rQQXEaU7s

The demonstration video showcases:
- The creative workflow challenges addressed by LensMind AI
- An overview of the AI-powered creator assistant
- The five AI intelligence modules and their roles
- Live image upload and AI-powered scene analysis
- Intelligent camera and editing recommendations
- Creator Memory and Workflow Recommendation features
- Analytics dashboard and AI insights
- Google Gemini AI integration
- How IBM Bob was used throughout development
- Real-world impact and future vision
  
---

## 🌐 Live Application
| Resource | Link |
|----------|------|
| 🌐 **Live Application** | https://lenz-mind-ai.vercel.app |
| 🎥 **Demo Video** | https://youtu.be/uwvytN99VpU?si=q3Irog0rQQXEaU7s |
| 💻 **GitHub Repository** | https://github.com/SRI-SARA-TEJ/LenzMind-AI |
| ⚙️ **Backend API** | https://lenzmind-ai.onrender.com/api/v1/health |
| ❤️ **Backend Health Check** | https://lenzmind-ai.onrender.com/api/v1/health |

---

## 🌍 Real-World Impact

LensMind AI is designed to make professional-grade creative analysis accessible to independent creators who cannot afford a full production team.

**Potential users include:**
- 📸 Independent photographers
- 🎥 YouTubers and video creators
- 📱 Social media content creators
- 🎬 Student filmmakers
- 📢 Small marketing and brand teams
- 🎨 Freelance creative professionals

Instead of relying on five separate tools and losing context between each one, creators can analyze, advise, and learn from every project inside a single AI-powered workspace.

LensMind AI demonstrates how AI can reduce the barrier between **raw creative output** and **publish-ready content** — making the quality of a five-person creative team available to a solo creator.

---

## 💎 Innovation

Traditional creative tool workflow:

```
Creator → Tool A (quality check) → Tool B (edit) → Tool C (caption) → publish
         (context lost between every tool)
```

LensMind AI workflow:

```
             Creator
                │
                ▼
         Upload Content
                │
                ▼
    ┌───────────────────────────┐
    │     Five Agents Working   │
    │     Simultaneously        │
    │                           │
    │  📷 Camera   ✂️ Editing    │
    │  📣 Content  📊 Analytics  │
    │  🧠 Memory                │
    └───────────────────────────┘
                │
                ▼
    Explainable Recommendations
    (with confidence scores)
                │
                ▼
    Accept · Dismiss · Learn
    (Creator Memory improves
     with every decision)
```

**The key innovation of LensMind AI** is that the Creator Memory agent makes the platform *adaptive* — every recommendation the creator accepts or dismisses trains the system to give better advice on the next project. No other tool in this workflow learns from the creator's choices.

---

## 🔮 Future Improvements

Future versions of LensMind AI may include:

- 📊 Full Analytics Agent with social platform API integration
- 🤝 Real-time collaboration for creative teams
- 📱 Mobile application (React Native)
- 🌍 Multilingual content optimization
- 🎞️ Direct video frame analysis (scene-by-scene)
- 🔔 Smart posting schedule notifications
- 📤 One-click export to social platforms
- 🧩 Plugin architecture for custom AI agents
- ☁️ Cloud storage integration (AWS S3, IBM COS)
- 📈 Creator growth dashboard with trend forecasting

---

## 🏆 IBM AI Builders Challenge Submission

| Field | Details |
|-------|---------|
| **Project** | LensMind AI |
| **Tagline** | Five AI Agents. One Creative Workspace. Zero Context-Switching. |
| **Challenge** | IBM AI Builders Challenge 2026 |
| **Challenge Period** | July 2026 |
| **Selected Theme** | Reimagine Creative Industries with AI |
| **Primary Development Tool** | IBM Bob |
| **AI Models** | Google Gemini 1.5 Flash (vision + text) |
| **Solution Type** | AI-Powered Multi-Agent Creative Workspace |
| **Application Type** | Full-Stack Web Application |
| **Frontend** | React 18 + Vite |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Number of AI Agents** | 5 |
| **Deployment** | Vercel + Render + MongoDB Atlas |
| **Category** | Creative AI / Multi-Agent Systems / Generative AI |

---

## ✅ Submission Checklist

### Development
- [x] Working LensMind AI prototype
- [x] Five AI agent architecture implemented
- [x] Camera Intelligence Agent (Google Gemini Vision)
- [x] Editing Intelligence Agent (Google Gemini Text)
- [x] Content Optimization Agent (Google Gemini Text)
- [x] Creator Memory Agent (Google Gemini Text)
- [x] Analytics Agent stub (roadmap)
- [x] Agent mock mode (works without Gemini credentials)
- [x] Recommendation accept / dismiss system
- [x] Frontend connected to backend

### Repository
- [x] Public GitHub repository
- [x] Complete root README with all required sections
- [x] `.env.example` files included
- [x] No API keys or secrets exposed in GitHub

### Deployment
- [x] Frontend deployed on Vercel
- [x] Backend deployed on Render
- [x] Live demo link added

### Media
- [x] Application screenshots added
- [x] Public demo video recorded and uploaded
- [x] Demo video under 3 minutes

### IBM Requirements
- [x] IBM Bob usage documented
- [x] IBM SkillsBuild learning activity completed
- [x] IBM SkillsBuild completion certificate uploaded
- [x] Challenge submission page completed and published

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **IBM Bob** — Primary AI-assisted development tool used throughout the entire development lifecycle
- **IBM SkillsBuild** — Learning resources supporting the challenge
- **IBM AI Builders Challenge 2026** — Challenge platform and opportunity
- **Google Gemini 1.5 Flash** — AI foundation powering all five creative agents (vision + text)
- **React & Vite** — Frontend application framework
- **Express.js** — Backend REST API framework
- **MongoDB & Mongoose** — Database layer
- **Open-source community** — Supporting tools and ecosystem

---

<div align="center">

**🎬 LensMind AI**

*Five AI Agents. One Creative Workspace. Zero Context-Switching.*

Built for the IBM AI Builders Challenge 2026
July Challenge — Reimagine Creative Industries with AI

*From raw content to publish-ready — powered by five collaborative AI agents.*

</div>
