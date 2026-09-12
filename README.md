# 🛡️ Sentinel AI — Autonomous Enterprise Operations & SRE Resilience Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](#)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](#)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61dafb.svg)](#)
[![Tailwind CSS v4](https://img.shields.io/badge/CSS-Tailwind%20v4-38bdf8.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**Sentinel AI** is an autonomous Site Reliability Engineering (SRE) operations copilot designed to detect, diagnose, simulate, and remediate microservices infrastructure failures before they impact end users.

Combining deterministic telemetry analytics, multi-agent AI reasoning, memory-augmented What-If simulation, and guarded autonomous remediation, Sentinel AI protects distributed production fleets in real time.

---

## 🌟 Core Capabilities

### 1. 🔬 Interactive Chaos Fault Injection & Resilience Testing
Simulate real-world microservice container breakdowns with live telemetry degradation:
- **PostgreSQL Database Connection Refused** (`order-service`)
- **Payment Gateway 504 Timeout** (`payment-service`)
- **Order Service Container CrashLoopBackOff** (`order-service`)
- **Product Catalog API 500 Failure Spike** (`product-service`)
- **CPU Compute Saturation Spike (99.4%)** (`order-service`)
- **Memory Leak & Impending OOM Kill** (`inventory-service`)

*Features per-button real-time progress indicators, active fault badging, zero-crash fallback resilience, and 1-click **Heal Fleet** restoration.*

### 2. 🧠 Deterministic & Multi-Agent Root Cause Analysis (RCA)
- Dissects structured logs, HTTP error codes, and container lifecycle events.
- Extracts telemetry evidence, identifies primary failure origins, and maps cascading downstream blast radius.
- Produces explainable confidence ratings and actionable remediation guidance.

### 3. 🧪 What-If Decision Engine (Simulation Sandbox)
- Evaluates four primary remediation strategies prior to execution:
  1. `Restart Service` (Direct container restart)
  2. `Rollback Deployment` (Revert to previous immutable image)
  3. `Restart Dependency` (Heal database/cache/gateway bottlenecks)
  4. `Scale Service` (Horizontal pod capacity expansion)
- Incorporates historical **Incident Memory** to reward previously successful remediation strategies.
- Forecasts recovery probabilities, risk scores, execution latencies, and provides ranked trade-off comparisons.

### 4. 🔒 SRE Safety & Guardrail Policy Layer
- Human-in-the-loop approval workflows for elevated risk interventions.
- Enforces action cooldown timers to eliminate remediation thrashing and cascading restart storms.
- Blocks destructive operational actions.

### 5. 🌐 Microservices Mesh & Topology Explorer
- Real-time health breakdown across 7 managed microservices.
- **Hierarchy Nodes View**: Directed caller-callee topologies with active operational badges.
- **Dependency Matrix View**: Comprehensive communication grid mapping 11 service connections.
- **Cascading Blast Radius Analysis**: Interactive simulator projecting downstream service outages.

### 6. 🔐 Enterprise Authentication Suite & Adaptive UI
- Production-grade user authentication with PBKDF2-HMAC-SHA256 password hashing and JWT bearer tokens.
- Protected console routing with auto-redirects and session restoration.
- Modern SaaS landing page inspired by modern dark-mode aesthetics.
- Custom vector Neural Vortex logo with radiant fuchsia-to-indigo gradients.
- Persistent Light / Dark mode toggle with seamless system color scheme synchronization.

---

## 🏗️ Architecture & Topology

```
                   ┌─────────────────────────────────────────┐
                   │    Client (React 19 + Tailwind v4)      │
                   │   Overview • Services • What-If Sandbox │
                   └────────────────────┬────────────────────┘
                                        │ JSON API / JWT
                                        ▼
                   ┌─────────────────────────────────────────┐
                   │       Sentinel FastAPI Gateway          │
                   │      Authentication & Rate Limits       │
                   └───────┬───────────────────┬─────────────┘
                           │                   │
            ┌──────────────▼───────┐    ┌──────▼────────────────┐
            │  What-If Engine      │    │ SRE Safety Guardrails │
            │  Simulation Sandbox  │    │ Cooldown & Validation │
            └──────────────┬───────┘    └──────┬────────────────┘
                           │                   │
            ┌──────────────▼───────────────────▼─────────────┐
            │            Incident Memory & SQLite            │
            │          Historical Success Embeddings         │
            └────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** >= 18.0.0
- **Python** >= 3.11
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Anxhu03/Sentinel-Ai.git
cd Sentinel-Ai
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs at `http://127.0.0.1:8000` (Interactive Swagger Docs: `/docs`).*

### 3. Frontend Setup
```bash
# In a new terminal window:
npm install
npm run dev --prefix frontend
```
*Frontend runs at `http://localhost:5173/`.*

### 4. Default Seeded Credentials
- **Username / Email**: `admin@sentinel.ai`
- **Password**: `sentinel_admin_password_2026`
*(Or use the 1-click **Quick Fill Admin** button on the sign-in screen).*

---

## 📡 Key API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new operator account with hashed credentials |
| `/api/auth/login` | `POST` | Authenticate and issue secure JWT bearer token |
| `/api/auth/me` | `GET` | Retrieve authenticated operator profile |
| `/api/services/` | `GET` | Microservices fleet status and health scores |
| `/api/dependencies/` | `GET` | Directed communication graph and blast radiuses |
| `/api/metrics/` | `GET` | Real-time processor telemetry, latencies, and error rates |
| `/api/incidents/simulate/{type}` | `POST` | Inject chaos failure vector (`db_down`, `payment_failure`, etc.) |
| `/api/incidents/recover` | `POST` | Execute autonomous fleet recovery |
| `/api/simulation/compare` | `POST` | Run What-If decision engine comparing 4 remediation options |
| `/api/memory/` | `GET` | Historical incident memory records and learning patterns |

---

## 🧪 Testing

Run backend test suites:
```bash
pytest tests/ -v
```
*Executes all 28 unit and integration tests covering authentication, safety guardrails, chaos simulations, predictive intelligence, and API contracts.*

Build frontend production bundle:
```bash
npm run build
```

---

## ☁️ Deployment

### Vercel Deployment
The repository includes configured [`vercel.json`](vercel.json) supporting both the compiled Vite single-page application and FastAPI serverless function execution:
```bash
# Deploy with Vercel CLI
npx vercel --prod
```

---

## 👥 Credits & Core Contributors

Special recognition and credits to the core engineering and design contributors of **Sentinel AI**:

* 🌟 **Anshuman Kumar**
* 🌟 **Aman Singh**
* 🌟 **Alok Keshari**
* 🌟 **Aman Rawat**

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.