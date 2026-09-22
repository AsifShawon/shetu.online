# EduWise V3

EduWise V3 is the full rewrite of the legacy Laravel product into:

- `frontend/` -> `Next.js 16+` + `TypeScript` + `Tailwind CSS` + shadcn-style UI + `Framer Motion`
- `backend/` -> `Django` + `Django REST Framework`
- `database` -> `MySQL`

The goal is to keep the **same product behavior** as V2 for users while rebuilding the internals in a cleaner, API-driven structure.

## 1. Project Goal

EduWise V3 should fully replace the Laravel version with feature parity across:

- public website
- authentication and role-based access
- student dashboard
- consultant dashboard
- agency dashboard
- admin portal
- educational catalog and content
- assessments, reports, and recommendations
- wallet, payments, and withdrawals
- course and package purchase flows
- student post marketplace
- V2 to V3 data migration

The target is not a file-by-file Laravel copy. The target is:

- same core features
- same business flows
- same user-facing structure
- cleaner backend APIs
- normalized MySQL schema
- easier long-term maintenance

## 2. Workspace Layout

```text
Eduwise_V3/
|-- frontend/
|-- backend/
|-- .gitignore
`-- README.md
```

### Frontend

`frontend/` contains:

- public pages
- auth pages
- student dashboard
- consultant dashboard
- agency dashboard
- admin portal
- reusable UI components
- API client and session helpers

### Backend

`backend/` contains:

- Django project config
- DRF APIs
- domain apps
- service wrappers
- import scripts
- MySQL-ready settings

## 3. Tech Stack

### Frontend

- Next.js 16+
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style component setup
- Framer Motion
- App Router

### Backend

- Django
- Django REST Framework
- MySQL
- session-based auth for web
- domain-based app split

### Planned Integrations

- OTP/email verification
- SMS sending
- PDF generation
- SurjoPay payment flow
- media/file uploads

## 4. Domain Structure

The backend is split by business domain instead of one large mixed app.

- `accounts`
  - users, roles, login, verification, profile completion
- `content`
  - sliders, about, testimonials, FAQ, terms, site settings, contact submissions
- `catalog`
  - countries, universities, courses, study levels, educational content
- `students`
  - student profile, academic data, choices, study-abroad leads
- `consultants`
  - consultant profile, services, qualification, experience, training, pro packages
- `assessments`
  - assessment requests, reports, recommendations, reviews, charge rules
- `payments`
  - wallet, transactions, orders, course orders, withdrawals, payouts
- `agencies`
  - agency profile, consultants, services, gallery, countries, earnings context
- `marketplace`
  - student posts and consultant quotations
- `admin_portal`
  - admin APIs, summaries, management endpoints

## 5. Current Implementation Status

This repository currently contains the V3 scaffold:

- Next.js route structure for public/auth/dashboard/admin areas
- reusable frontend layout and UI primitives
- Django project structure with domain apps
- normalized model foundations across major business areas
- DRF route groups under `/api/...`
- placeholder service wrappers for OTP, SMS, PDF, and payments
- starter import script for V2 migration

This is not yet a finished production system. The scaffold exists so feature implementation can now proceed in a controlled order.

## 6. How To Build V3 From Start To Finish

This is the recommended execution order for the project.

### Phase 1: Environment Setup

Prepare local tools:

- Node.js 20+ or newer
- npm
- Python 3.12+ or compatible project version
- pip
- MySQL 8+

Create local environment files:

- `frontend/.env.local`
- `backend/.env`

Use the backend example file as the base:

- `backend/.env.example`

### Phase 2: Install Dependencies

Frontend:

```powershell
cd Eduwise_V3/frontend
cmd /c npm install
```

Backend:

```powershell
cd Eduwise_V3/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Phase 3: Configure Database

Create a MySQL database for V3, for example:

- database name: `eduwise_v3`

Set backend environment values:

- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

### Phase 4: Generate Django Migrations

After dependencies are installed:

```powershell
cd Eduwise_V3/backend
.venv\Scripts\activate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Phase 5: Run Frontend and Backend

Backend:

```powershell
cd Eduwise_V3/backend
.venv\Scripts\activate
python manage.py runserver
```

Frontend:

```powershell
cd Eduwise_V3/frontend
cmd /c npm run dev
```

Expected local URLs:

- frontend: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`

## Docker Quick Start

The project now includes a Docker Compose stack for:

- `frontend` -> Next.js app on `http://localhost:3000`
- `backend` -> Django app on `http://localhost:8000`
- `db` -> MySQL 8 on the internal Docker network

From the `Eduwise_V3/` directory:

```powershell
docker compose up --build
```

To stop the stack:

```powershell
docker compose down
```

To remove the database volume as well:

```powershell
docker compose down -v
```

Notes:

- The backend container runs `python manage.py migrate --noinput` before starting Django.
- MySQL is published to `127.0.0.1:${MYSQL_HOST_PORT}` for local Docker access. The local default is `3307` to avoid conflicts with a host MySQL service already using `3306`.
- The frontend uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` for browser requests.
- The frontend uses `INTERNAL_API_BASE_URL=http://backend:8000` for server-side requests inside Docker.
- If you change `NEXT_PUBLIC_API_BASE_URL`, rebuild the frontend image so the client bundle picks up the new value.

## 7. Feature Build Order

Build the product in this order so the foundations are stable before business flows are added.

### Step 1: Auth and Roles

Implement fully:

- register
- login
- logout
- OTP verification
- current session endpoint
- role-aware redirects
- protected routes

This unlocks every dashboard area.

### Step 2: Public Content and Catalog

Implement:

- home page content
- about page
- contact form
- consultant listing
- study abroad content
- countries
- universities
- courses
- educational info pages

This gives V3 a complete public-facing shell.

### Step 3: Student Module

Implement:

- student profile
- academic and postgraduate data
- student choices
- study abroad lead requests
- wallet view
- student posts
- quotations view

### Step 4: Consultant Module

Implement:

- consultant profile
- qualifications
- experience
- trainings
- services
- assessment queue
- report creation
- recommendation management
- earnings overview
- reviews view

### Step 5: Assessment Flow

Implement the full workflow:

- student requests assessment
- consultant accepts or rejects
- system applies charges
- consultant prepares report
- recommended universities are attached
- student receives report
- student leaves review

This is one of the most important parity flows.

### Step 6: Payments and Wallet

Implement:

- wallet top-up
- payment callback handling
- transaction history
- consultant payout methods
- withdrawal requests
- order records
- course order records
- enrollment records
- pro package purchase

### Step 7: Marketplace

Implement:

- student post creation
- public/private post listing depending on business rules
- quotation submission
- quotation management

### Step 8: Agency Module

Implement:

- agency profile
- agency consultant management
- agency services
- agency countries
- agency gallery
- agency transaction view

### Step 9: Admin Portal

Implement:

- dashboard summaries
- content CRUD
- catalog CRUD
- package management
- verification queue
- transaction management
- training/course management
- moderation and oversight tools

## 8. Frontend Development Rules

Frontend should preserve the familiar V2 page structure, but implementation should follow reusable React patterns.

### Core rules

- use server components by default
- use client components only where interaction is needed
- keep route groups aligned with user roles
- centralize API access in shared client helpers
- keep design clean and modern, but close to current business UX
- use Framer Motion intentionally, not excessively
- reuse shadcn-style component primitives across all dashboard sections

### Main route areas

- `(public)`
- `(auth)`
- `dashboard/student`
- `dashboard/consultant`
- `dashboard/agency`
- `admin`

## 9. Backend Development Rules

Backend should be API-first and domain-driven.

### Core rules

- expose DRF endpoints by domain, not by page
- use real foreign keys instead of string references
- replace JSON array storage with relation tables where needed
- standardize statuses and enums
- keep business logic out of view code where possible
- keep permission rules explicit by role
- preserve V2 business meaning, not V2 technical mess

### Main API groups

- `/api/auth/`
- `/api/accounts/`
- `/api/content/`
- `/api/catalog/`
- `/api/students/`
- `/api/consultants/`
- `/api/assessments/`
- `/api/payments/`
- `/api/agencies/`
- `/api/marketplace/`
- `/api/admin/`

## 10. Data Migration Plan

V3 should migrate existing V2 MySQL data instead of starting empty in production.

### Migration order

1. users and admins
2. site settings and CMS content
3. countries, universities, courses, study levels
4. educational info content
5. student profile data and student choices
6. consultant profile data, qualifications, experience, trainings, services
7. assessments, reports, recommendations, reviews
8. wallet transactions and payout data
9. orders, course orders, enrollments, pro subscriptions
10. agencies and related records
11. student posts and quotations

### Migration rules

- keep legacy IDs as reference fields where helpful
- map old statuses into clean V3 statuses
- convert JSON-style fields into normalized relations
- preserve file/media paths where possible
- log import failures clearly
- make import scripts rerunnable

### Script location

- `backend/scripts/import_v2.py`

## 11. Testing Strategy

V3 should be validated at several levels.

### Backend tests

- model tests
- serializer tests
- permission tests
- API tests

### Frontend tests

- route rendering tests
- form interaction tests
- dashboard state tests

### End-to-end flows

- auth
- student assessment flow
- consultant report flow
- wallet top-up
- withdrawal request
- admin CRUD
- marketplace interactions

### Migration validation

- compare important record counts between V2 and V3
- verify imported relations
- verify imported media mapping

## 12. Definition Of Done

EduWise V3 is complete when:

- all core V2 features exist in V3
- all role-based dashboards work end-to-end
- public content is manageable from admin
- assessment flow is fully functional
- payment and wallet flows are stable
- imported V2 data is usable in V3
- role permissions are enforced correctly
- frontend and backend work together without Laravel dependencies
- deployment setup is stable for production

## 13. Immediate Next Steps

The scaffold is ready. The next practical work items are:

1. install frontend and backend dependencies
2. generate Django migrations
3. wire real auth/session handling
4. connect public content and catalog APIs to frontend pages
5. implement the first complete business flow end-to-end
   Suggested first full flow: auth -> student profile -> consultant service listing -> assessment request

## 14. Related Docs

- [frontend/README.md](</c:/Users/User/Documents/FleekBD/Porjects/EduWise-V2.0/Eduwise_V3/frontend/README.md>)
- [backend/README.md](</c:/Users/User/Documents/FleekBD/Porjects/EduWise-V2.0/Eduwise_V3/backend/README.md>)
- [backend/scripts/README.md](</c:/Users/User/Documents/FleekBD/Porjects/EduWise-V2.0/Eduwise_V3/backend/scripts/README.md>)
- [PLAN.md](</c:/Users/User/Documents/FleekBD/Porjects/EduWise-V2.0/PLAN.md>)
