# CommonGround

A crowdsourced societal challenge and collaborative problem-solving platform.

CommonGround empowers citizens to report real community issues, validate them through peer support, collaborate on actionable solutions, and track problem resolution through an open civic lifecycle.

---

## 🛠 Tech Stack

### Backend
- **Framework:** Python 3.11+ / Django 5 + Django REST Framework (DRF)
- **Database:** SQLite (local dev) / PostgreSQL (production ready)
- **Authentication:** Stateless JWT via `djangorestframework-simplejwt`
- **Documentation:** OpenAPI schema & Swagger UI via `drf-spectacular`
- **CORS:** `django-cors-headers`

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS v3 with Deep Indigo (`#4F46E5`) & Warm Amber (`#F59E0B`) palette, dark mode support
- **UI Components:** Custom accessible primitives modeled after shadcn/ui
- **Data Fetching:** TanStack Query v5 + Axios (with automatic 401 token refreshing)
- **Routing:** React Router v6
- **Analytics:** Recharts

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed demo data (creates categories, tags, demo users, challenges, solutions)
python manage.py seed_demo_data

# Run dev server
python manage.py runserver 0.0.0.0:8000
```

- **API Base:** `http://localhost:8000/api/v1/`
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **Django Admin:** `http://localhost:8000/admin/`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

- **Frontend App:** `http://localhost:5173/`

---

## 📁 Repository Structure

```
commonground/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Custom user, profiles, JWT auth
│   │   ├── challenges/     # Categories, tags, challenges, lifecycle
│   │   ├── solutions/      # Proposals, revisions, voting, acceptance
│   │   ├── engagement/     # Threaded comments, votes, moderation reports
│   │   ├── notifications/  # Signal-driven notifications & mark-read
│   │   └── core/           # Pagination, permissions, seed script, stats
│   ├── config/             # Settings, URLs, WSGI
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance, query hooks
│   │   ├── components/     # UI primitives, layout, feature components
│   │   ├── context/        # AuthContext (JWT management)
│   │   ├── pages/          # Landing, Explore, ChallengeDetail, Dashboard, etc.
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```
