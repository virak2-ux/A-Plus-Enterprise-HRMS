# Cambodia Enterprise Human Resource Management System (HRMS)

A production-ready, modular, bilingual (**Khmer & English**), multi-currency (**KHR & USD**) Human Resource Management System designed for enterprises operating in Cambodia (10 to 5,000+ employees).

---

## 1. Key Features

- **Full Employee Lifecycle**: Organization structure, multi-company support, positions, employee master data, biometric attendance, shift scheduling, Cambodia holidays, leave workflows, and offboarding.
- **Cambodia Deterministic Payroll Engine**:
  - Fully configurable and versioned GDT Tax on Salary (ToS) progressive brackets.
  - Dependent rebates (150,000 KHR/person for spouse and children).
  - NSSF statutory calculations: Occupational Risk (0.8%), Health Care (2.6%), and Pension Scheme (2% employee + 2% employer) with wage ceiling and floor limits.
  - Multi-currency: Contracts in USD converted at active NBC exchange rates, with dual-currency net payout statements.
  - Explainable calculation snapshot with complete mathematical trace and formula logging.
  - 16-step payroll execution lifecycle: Draft → Calculated → Review → Approved → Locked.
- **Enterprise Security & RBAC**:
  - Argon2id password hashing.
  - 12 predefined roles across 11 action types.
  - Sensitive confidential field masking (base salaries, bank accounts, national IDs).
  - Immutable audit trail with old/new snapshot JSON diffs.
- **Modern Responsive UI**:
  - Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons.
  - TanStack Table v8 for virtualized employee records, search, sorting, and filters.
  - Recharts for executive management dashboards.
  - Real-time bilingual toggling (**English** and **ភាសាខ្មែរ**) and currency switcher (**$ USD** and **៛ KHR**).

---

## 2. Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Table v8, TanStack Query v5, Recharts, Lucide React.
- **Backend**: Python 3.13+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, Argon2-cffi, PyJWT.
- **Database & Cache**: PostgreSQL 17+, Redis 7+ (with automatic SQLite fallback for lightweight standalone development).
- **Background Worker**: Celery + Redis broker.
- **Document & Media Storage**: S3-compatible private object store (MinIO dev / AWS S3 prod).
- **Testing**: Pytest (100% passing automated unit & integration test suite).

---

## 3. Project Directory Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API routers (auth, org, employees, attendance, leave, payroll, system)
│   │   ├── core/            # Config, database engine, Argon2/JWT security
│   │   ├── models/          # SQLAlchemy 2.0 models across 26 domains
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # Deterministic Cambodia payroll engine, audit logger
│   │   └── main.py          # FastAPI application entry point
│   ├── scripts/
│   │   └── seed_data.py     # Database seeder (roles, rules, company, employees)
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (Dashboard, Employees, Payroll)
│   │   ├── components/      # Reusable Navbar, Sidebar, and UI widgets
│   │   ├── context/         # Bilingual i18n and KHR/USD currency context
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

### Option A: Running with Docker Compose (Recommended for Production)

```bash
# Clone and enter repository
cd "HR System"

# Copy environment variables
cp .env.example .env

# Build and start all services (Frontend, Backend, Postgres, Redis, MinIO, Celery)
docker compose up -d

# Run database seeder inside backend container
docker compose exec backend python scripts/seed_data.py
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/api/v1/docs`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `minioadminpassword`)

---

### Option B: Local Standalone Development

#### 1. Backend Setup
```bash
cd backend
# Create virtual environment and install dependencies
uv venv .venv --python 3.14
uv pip install -r requirements.txt

# Run database seeder (initializes database, roles, rules, and demo employees)
.venv\Scripts\python scripts\seed_data.py

# Run automated tests
.venv\Scripts\pytest -v

# Start FastAPI dev server
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
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

## 6. Deterministic Payroll Calculation Breakdown

For an employee with a **$1,000.00 USD** monthly contract salary:
1. **Gross Conversion**: `$1,000 × 4,100 KHR/USD = 4,100,000 KHR`.
2. **NSSF Pension Deduction (2%)**: Contributory wage capped at `1,200,000 KHR`. Employee deduction is `24,000 KHR`.
3. **Taxable Salary Base**: `4,100,000 KHR - 24,000 KHR = 4,076,000 KHR`.
4. **Dependent Relief**: 1 spouse + 1 qualifying child = `300,000 KHR` relief.
5. **GDT Progressive Brackets Applied**:
   - 0 to 1,500,000 KHR: 0%
   - 1,500,001 to 2,000,000 KHR: 5% = `25,000 KHR`
   - 2,000,001 to 3,776,000 KHR: 10% = `177,600 KHR`
   - Total Tax on Salary: `202,600 KHR`.
6. **Net Salary**: `4,100,000 - 24,000 - 202,600 = 3,873,400 KHR` (`$944.73 USD`).
7. **Audit Snapshot**: The full calculation breakdown is captured as immutable JSON for retrospective auditability.
