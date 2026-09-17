# A Plus Enterprise HRMS

> **Enterprise Human Resource Management & Deterministic Cambodia Payroll System**  
> **Author & Creator**: `@virak81`  
> **Repository**: [https://github.com/virak2-ux/A-Plus-Enterprise-HRMS](https://github.com/virak2-ux/A-Plus-Enterprise-HRMS)

A production-ready, modular, bilingual (**Khmer & English**), multi-currency (**KHR & USD**) Human Resource Management System designed for enterprises operating in Cambodia (10 to 5,000+ employees), equipped with **Global Dark Mode** and modern **Gen Z UI**.

---

## 1. Key Features & Domain Modules

- **Interactive Visual Org Chart & Headcount Budgeting**:
  - Recursive employee reporting hierarchy tree starting from executive leaders down through direct report lines with collapse/expand branches and report counts.
  - Headcount quota tracking vs. actual filled seats, vacancy monitoring, and department compensation budget vs actual payroll burden.
  - Salary band compliance radar flagging employees below Grade minimum or exceeding maximum thresholds.
- **Global Dark Mode & Gen Z Glassmorphic UI**:
  - Persistent theme engine (Sun ☀️ / Moon 🌙 toggle) synchronized with `localStorage` and system preference.
  - Ambient glowing gradient meshes, glassmorphism (`backdrop-blur-xl`), and vibrant neon statutory tags.
- **Cambodia Labor Law Article 139 Overtime Engine**:
  - Enforced statutory overtime multipliers:
    - **150% (1.5x)**: Normal Day Overtime (Monday – Saturday)
    - **200% (2.0x)**: Night Shift Overtime (22:00 – 06:00)
    - **200% (2.0x)**: Weekly Rest Day (Sunday)
    - **200% (2.0x)**: Paid Public Holidays (Prakas 443)
  - Automated payroll ingestion: approved overtime dynamically feeds earnings into locked payroll runs.
- **Progressive Disciplinary Compliance & Official Warning Letters (Articles 26–29)**:
  - Progressive pipeline: Verbal $\to$ 1st Written $\to$ 2nd Written $\to$ Suspension $\to$ Dismissal.
  - Strict Article 27 validation: Disciplinary suspension without pay cannot legally exceed **7 days**.
  - Official bilingual printable Ministry of Labour and Vocational Training (MLVT) Warning Letter HTML (`លិខិតព្រមាន`).
- **Statutory Seniority Leave (Art. 166) & Leave Encashment Calculator (Art. 167)**:
  - Base 18 days/year + 1 additional day for every 3 years of continuous service (`years // 3`).
  - Leave encashment formula based on statutory 26 working days (`daily_wage = base_salary / 26`).
  - Official Prakas 443 20-day public holidays calendar.
- **Full-Stack Employee Self-Service (ESS) & Manager Approvals**:
  - 6-tab responsive portal: Geofenced web clock-in/out, leave requests, overtime applications, salary advance applications, disciplinary notice sign-off, and 1-click supervisor approvals center.
- **Deterministic Cambodia Payroll Engine**:
  - GDT Tax on Salary (ToS) progressive brackets (0%–20%) with 150,000៛/person dependent rebates.
  - NSSF statutory calculations: Occupational Risk (0.8%), Health Care (2.6%), and Pension (2% employee + 2% employer) with wage ceilings.
  - ABA Bank, ACLEDA Bank, and Universal batch disbursement exports.
  - Official bilingual printable payslips (`ប័ណ្ណបើកប្រាក់បៀវត្ស`).
- **Enterprise Security, Audit Trail & Multi-Branch Switcher**:
  - Argon2id password hashing, RBAC, and tamper-evident append-only audit trail logging JSON state diffs.
  - Multi-location context switcher (Phnom Penh HQ, Siem Reap Hub, Sihanoukville Port).

---

## 2. Technology Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, TanStack Table v8, Recharts, Lucide React.
- **Backend**: Python 3.13+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, Argon2-cffi, PyJWT.
- **Database & Cache**: PostgreSQL 17+, Redis 7+ (with automatic SQLite fallback for lightweight standalone development).
- **Testing**: Pytest (All 36 automated unit & integration tests passing with 100% success).

---

## 3. Project Directory Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API routers (auth, org, employees, attendance, leave, payroll, overtime, loans, disciplinary, ai)
│   │   ├── core/            # Config, database engine, Argon2/JWT security
│   │   ├── models/          # SQLAlchemy 2.0 models across 26 domains
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # Deterministic Cambodia payroll engine, audit logger, bank exports, payslip generator
│   │   └── main.py          # FastAPI application entry point
│   ├── scripts/
│   │   └── seed_data.py     # Database seeder (roles, rules, company, employees)
│   ├── tests/               # 8 test modules (36 tests, 100% passing)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (21 routes: Dashboard, Org Chart, Employees, ESS, Payroll, Overtime, Disciplinary, etc.)
│   │   ├── components/      # Navbar, Sidebar, modals, and UI widgets
│   │   ├── context/         # Bilingual i18n, KHR/USD currency, and Global Theme (Dark/Light) context
│   │   ├── locales/         # en.json and km.json translation dictionaries
│   │   └── lib/             # Axios API client
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml       # Production multi-container orchestration
├── .env.example             # Environment configuration template
└── README.md
```

---

## 4. Quickstart Guide

### Option A: Running with Docker Compose

```bash
# Clone and enter repository
git clone https://github.com/virak2-ux/A-Plus-Enterprise-HRMS.git
cd A-Plus-Enterprise-HRMS

# Copy environment variables
cp .env.example .env

# Build and start all services
docker compose up -d

# Run database seeder inside backend container
docker compose exec backend python scripts/seed_data.py
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/api/v1/docs`

---

### Option B: Local Standalone Development

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# Run database seeder
.venv\Scripts\python scripts\seed_data.py

# Run all 36 tests
.venv\Scripts\pytest -v

# Start FastAPI server
.venv\Scripts\uvicorn app.main:app --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm start # or npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 5. Seed Demo Accounts

| Role | Username / Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@cambodia-hrms.com` | `Admin@123456` | Full system privileges across all modules |
| **HR Manager** | `hrmanager@cambodia-hrms.com` | `Hr@123456` | Employee records, attendance, leave, recruitment |
| **Payroll Officer** | `payroll@cambodia-hrms.com` | `Payroll@123456` | Salary structures, payroll calculations, bank export |

---

## 6. Credit & License

Developed and architected by **`@virak81`**.  
Repository: [https://github.com/virak2-ux/A-Plus-Enterprise-HRMS](https://github.com/virak2-ux/A-Plus-Enterprise-HRMS)
