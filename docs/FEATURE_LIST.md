# Project Feature List

## 1. Project Overview

**EduWise V3** is a full rewrite and modernization of the legacy Laravel-based EduWise V2 platform. It is a comprehensive study-abroad consultation and educational catalog ecosystem designed for students seeking higher education abroad, independent consultants, educational agencies, and platform administrators. 

By transitioning to a decoupled architecture utilizing Next.js (frontend) and Django REST Framework (backend), the project solves legacy performance issues, streamlines data relations, and provides a modern, responsive user experience. It serves as a matchmaking and service-delivery platform where students can request academic assessments, browse detailed country guidelines, buy educational tutoring courses, and interact with verified consultants and agencies through a structured service workflow and student post marketplace.

---

## 2. Feature List Overview

The following table summarizes all identified features of the EduWise V3 platform, grouped by operational module:

| Feature ID | Module | Feature Name | User Type | Status | Short Summary |
| ---------- | ------ | ------------ | --------- | ------ | ------------- |
| **F-001** | Authentication & Access | OTP-based Registration | Public / Anonymous | MVP Done | Allows users to sign up by verifying their email or phone via a 4-digit OTP. |
| **F-002** | Authentication & Access | Session-based Login | Public / Registered | Completed | Secure session login with CSRF cookie protection and HTTP-only credentials. |
| **F-003** | Authentication & Access | Password Management | Registered User | Completed | Allows registered users to change their password or reset it via OTP verification. |
| **F-004** | Authentication & Access | Session Logout | Registered User | Completed | Invalidates active login sessions and clears secure client cookies. |
| **F-005** | User Profiles | Student Profile | Student | Completed | Profile management including personal details, academic tracks, CV, and certificates. |
| **F-006** | User Profiles | Consultant Profile | Consultant | Completed | Setup of expertise, years of experience, credentials, and profile verification status. |
| **F-007** | User Profiles | Agency Profile | Agency | Completed | Setup of agency company profiles with banners, description, slogans, and galleries. |
| **F-008** | User Profiles | Saved Consultants | Student | Completed | Enables students to bookmark preferred consultants or agencies for quick access. |
| **F-009** | Educational Catalog | Service Categories | All Users | Completed | Directory of platform consultation categories (e.g., Visa Guidance, Scholarships). |
| **F-010** | Educational Catalog | Countries & Cities | All Users | Completed | Mapped catalog of countries and cities supporting student choice settings. |
| **F-011** | Educational Catalog | Universities & Courses | All Users | Completed | Mapped university and course listings supporting academic recommendations. |
| **F-012** | Educational Catalog | Country Info Pages | All Users | Completed | Detailed landing pages with costs, FAQs, top universities, and visa checklist items. |
| **F-013** | Student Choices & Leads | Study Abroad Choices | Student | Completed | Portal for students to save their preferred destinations, subjects, intake, and budget. |
| **F-014** | Student Choices & Leads | Lead Query Form | Public / Anonymous | Completed | Lead capture form for public visitors to submit profiles for study-abroad inquiries. |
| **F-015** | Consultant Services | Custom Service Creation | Consultant | Completed | Enables consultants to create custom service offerings with custom pricing/durations. |
| **F-016** | Consultant Services | Training Courses Catalog | Consultant / Admin | MVP Done | Management of tutoring courses and training programs for student enrollment. |
| **F-017** | Assessment Workflow | Assessment Request | Student / Consultant | Completed | Enables students to request a custom assessment and consultants to accept/reject. |
| **F-018** | Assessment Workflow | Custom Proposals | Student / Consultant | Completed | Allows consultants to submit negotiated pricing and duration proposals for requests. |
| **F-019** | Assessment Workflow | Assessment Reports | Student / Consultant | Completed | Interactive workspace for consultants to write reports and review student histories. |
| **F-020** | Assessment Workflow | Mapped Recommendations | Consultant | Completed | Allows consultants to attach recommended universities and tuition details to reports. |
| **F-021** | Assessment Workflow | Report Revisions | Student / Consultant | Completed | Revision request workflow where students can request report updates from consultants. |
| **F-022** | Assessment Workflow | Reviews & Ratings | Student | Completed | Post-assessment review workflow for students to rate and review consultant services. |
| **F-023** | Payments & Wallet | Transaction Logs | Registered User | Completed | Displays wallet balance, cash-in/out logs, payment methods, and bank reference IDs. |
| **F-024** | Payments & Wallet | Assessment Orders | Student | Completed | Coordinates order placement and payment flows for assessment bookings. |
| **F-025** | Payments & Wallet | Course Enrollments | Student | Completed | Coordinates payments and enrollments for consultant-provided training courses. |
| **F-026** | Payments & Wallet | Consultant Payout Setup | Consultant | Completed | Setup of bank accounts and mobile banking credentials for receiving withdrawals. |
| **F-027** | Payments & Wallet | Withdrawal Requests | Consultant | Completed | Allows consultants to request payouts of released funds, subject to reserve rules. |
| **F-028** | Payments & Wallet | Assessment Settlements | Consultant / Admin | Completed | Calculates net earnings, applies platform commission, and manages 15-day hold periods. |
| **F-029** | Marketplace | Student Posts | Student | Completed | Enables students to publish custom study abroad requirements to a public board. |
| **F-030** | Marketplace | Quotation Submissions | Consultant | Completed | Allows consultants to send custom service quotations for student marketplace posts. |
| **F-031** | Agency Management | Consultant Network | Agency | Completed | Enables agencies to invite, link, and display consultants under their profile. |
| **F-032** | Agency Management | Agency Offerings | Agency | Completed | Mappings of specific countries, service categories, and gallery items for agencies. |
| **F-033** | Admin & Moderation | Admin Dashboard | Admin | MVP Done | High-level analytics of user sign-ups, system transactions, and service statistics. |
| **F-034** | Admin & Moderation | Automated Moderation | System | Completed | Auto-flags restricted content in assessments or reviews using key term matching. |
| **F-035** | Admin & Moderation | User Banning Control | Admin | Completed | Allows admins to review moderation incidents and place bans/suspensions on users. |
| **F-036** | Admin & Moderation | Admin Invitations | Admin | Completed | Secure token-based system to invite and register additional administrator profiles. |
| **F-037** | Admin & Moderation | Profile Verification | Admin | Completed | Queue for admins to review and approve/reject consultant credentials and profiles. |
| **F-038** | Admin & Moderation | Transaction Oversight | Admin | Completed | Dashboard to manage user transactions, process refunds, and review settlements. |
| **F-039** | CMS & Settings | Branding Settings | Admin | Completed | Dynamic site settings (logo, support phone, email, address, and social links). |
| **F-040** | CMS & Settings | CMS Content CRUD | Admin | Completed | Full management of public testimonials, FAQs, page sliders, and terms documents. |
| **F-041** | Integrations | SurjoPay Payment Gateway | Student / System | Partial | Local checkout redirect simulation; production API credentials must be wired. |
| **F-042** | Integrations | SMS & Email OTP Gateways | System | Partial | Console email backend is active; production SMTP and SMS stubs need wiring. |
| **F-043** | Integrations | PDF Report Generator | System | Partial | Code renders report HTML schemas; bytecode PDF binary exporter remains a stub. |
| **F-044** | Integrations | V2 Data Migrator | Admin / Developer | MVP Done | Command-line script to migrate legacy Laravel V2 database schema to V3 Django. |

---

## 3. Module-Wise Feature Summary

### M1. Authentication & User Access
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-001 | OTP-based Registration | Users initiate signup and must verify their email or phone using a temporary 4-digit OTP. | MVP Done |
| F-002 | Session-based Login | Authenticates registered users securely via cookie-based sessions with integrated CSRF tokens. | Completed |
| F-003 | Password Management | Registered users can change active passwords or request password resets via OTP verification. | Completed |
| F-004 | Session Logout | Safely terminates user sessions on the server and clears browser authorization cookies. | Completed |

### M2. User Profile
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-005 | Student Profile | Allows students to enter academic details, upload language transcripts, CV, and track profile completion. | Completed |
| F-006 | Consultant Profile | Allows consultants to set their experience levels, base pricing, upload qualifications, and view verification statuses. | Completed |
| F-007 | Agency Profile | Enables educational agencies to set up slogans, banners, mission/vision statements, and upload company gallery images. | Completed |
| F-008 | Saved Consultants | Students can bookmark profile details of preferred consultants or agencies for direct consultation requests. | Completed |

### M3. Educational Catalog
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-009 | Service Categories | Manages standard consultation categories (e.g., IELTS Preparation, Visa Processing) offered on the platform. | Completed |
| F-010 | Countries & Cities | Maintains the master list of countries and cities mapped to universities, courses, and student profiles. | Completed |
| F-011 | Universities & Courses | Mapped lists of partner universities and courses available globally to attach to student recommendations. | Completed |
| F-012 | Country Info Pages | Public landing pages detailing study-abroad pathways, typical costs, FAQs, and visa checklists per country. | Completed |

### M4. Student Choices & Leads
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-013 | Study Abroad Choices | Portal inside the student dashboard to log preferred countries, subjects, target sessions, and budgets. | Completed |
| F-014 | Lead Query Form | Public contact form for prospective students to submit inquiries, GPA, and IELTS scores to the system. | Completed |

### M5. Consultant Offerings & Services
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-015 | Custom Service Creation | Consultants customize and publish their specialized services by country, subject, price, and duration. | Completed |
| F-016 | Training Courses Catalog | Allows consultants to set up and list structured courses or tutoring programs for students to buy. | MVP Done |

### M6. Assessment Workflow
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-017 | Assessment Request | Students send assessment requests containing their academic summaries, budget, and subject queries to consultants. | Completed |
| F-018 | Custom Proposals | Consultants can counter-propose a custom charge or completion duration before accepting a student assessment. | Completed |
| F-019 | Assessment Reports | Consultant workspace for drafting and submitting reports containing IELTS goals, English prep, and visa guides. | Completed |
| F-020 | Mapped Recommendations | Consultants attach estimated tuition costs, visa processing times, and scholarship info for recommended universities. | Completed |
| F-021 | Report Revisions | Students can request modifications to submitted reports, opening a revision feedback loop with the consultant. | Completed |
| F-022 | Reviews & Ratings | Students rate consultants out of 5 stars and submit feedback messages after completing an assessment. | Completed |

### M7. Payments & Wallet
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-023 | Transaction Logs | Displays wallet balances and details for all payments, withdrawals, mobile transfers, and cash-in operations. | Completed |
| F-024 | Assessment Orders | Processes student checkout requests for booking assessments, routing transactions through order models. | Completed |
| F-025 | Course Enrollments | Manages student payments for training courses and toggles course access permissions and deadlines. | Completed |
| F-026 | Consultant Payout Setup | Consultants save bank accounts or mobile banking numbers to receive platform payout withdrawals. | Completed |
| F-027 | Withdrawal Requests | Consultants submit withdrawal requests for released funds, verifying their active balance stays above the minimum reserve. | Completed |
| F-028 | Assessment Settlements | Platform logs gross settlements, applies standard commissions, and moves net consultant earnings to a 15-day hold state. | Completed |

### M8. Marketplace
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-029 | Student Posts | Students post their academic summaries, requirements, and budgets onto a public marketplace request feed. | Completed |
| F-030 | Quotation Submissions | Consultants browse the student post feed and submit custom consultation quotes linked to their services. | Completed |

### M9. Agency Management
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-031 | Consultant Network | Agencies link verified consultants to their profile and display their team roster to the public. | Completed |
| F-032 | Agency Offerings | Agencies highlight specific country offerings, service capabilities, and display active office gallery images. | Completed |

### M10. Admin & Moderation
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-033 | Admin Dashboard | Visual portal for admins tracking active users, total platform transactions, verification queues, and system counts. | MVP Done |
| F-034 | Automated Moderation | Scans assessments and review messages for profanity or restricted terms, logging flag incidents automatically. | Completed |
| F-035 | User Banning Control | Admins can review flagged incidents, dismiss them, action them, or enforce temporary or permanent user bans. | Completed |
| F-036 | Admin Invitations | Admin accounts send tokenized invitations allowing new administrators to register safely. | Completed |
| F-037 | Profile Verification | Verification queue where admins inspect uploaded consultant qualifications and toggle profile approval statuses. | Completed |
| F-038 | Transaction Oversight | Portal to review all platform payments, resolve pending refund requests, and authorize withdrawal completions. | Completed |

### M11. CMS & Settings
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-039 | Branding Settings | Admins manage logos, support contact numbers, email address mappings, and company social media URLs. | Completed |
| F-040 | CMS Content CRUD | Admins perform CRUD actions on landing sliders, about sections, public FAQs, site terms, and student testimonials. | Completed |

### M12. Integrations
| Feature ID | Feature | Summary | Status |
| ---------- | ------- | ------- | ------ |
| F-041 | SurjoPay Payment Gateway | Processes wallet top-ups and orders via SurjoPay; currently runs a mock gateway return flow. | Partial |
| F-042 | SMS & Email OTP Gateways | Handled via Django email wrapper and an SMS service stub; requires physical SMS API and SMTP setup. | Partial |
| F-043 | PDF Report Generator | Prepares detailed HTML report layouts; requires final bytecode PDF converter utility configuration. | Partial |
| F-044 | V2 Data Migrator | Script that imports Laravel V2 MySQL data, mapping records and normalizations to the Django V3 database structure. | MVP Done |

---

## 4. User Roles & Access Summary

The platform uses a role-based access control system managed at both the Django REST Framework API layer and Next.js frontend route middleware.

| User Role | Main Access / Capabilities |
| --------- | -------------------------- |
| **Anonymous / Public User** | Can view the public landing page, browse country info pages, view consultant listings, search by country/service, fill in lead inquiry forms, and initiate signup. |
| **Student** | Can manage their academic profile, add choices, request custom assessments, accept proposals, review reports, leave consultant ratings, create marketplace posts, top up their wallet, and pay for courses. |
| **Consultant** | Can manage their profile, qualifications, experiences, and custom service offerings. Can accept/reject assessment requests, make proposals, submit assessment reports, view wallet balance, set up bank/mobile payout details, and request withdrawals. |
| **Agency** | Personal profile management, gallery configuration, service/country offering creation, linking/inviting consultants, and reviewing billing transactions. |
| **Admin** | Accesses the custom admin portal; manages all CMS content and branding settings, reviews consultant credentials in the verification queue, moderates flagged content, bans users, processes refunds and withdrawals, and invites additional admins. |

---

## 5. MVP Completion Summary

Based on an audit of the Next.js frontend code and Django backend models, views, and services, the project contains the following completion states:

### Completed / Mostly Complete
* **Core Authentication & Roles**: Session-based login, CSRF verification, and secure HTTP-only cookies are fully wired.
* **Student, Consultant, & Agency Dashboard Modules**: Comprehensive React forms, tables, and views exist in Next.js, and match DRF ViewSets/models for profile updates, qualifications, services, country offerings, and experiences.
* **Assessment Workflow Logic**: Complete API views tracking state transitions (Draft, Pending, Accepted, Proposals, Reports, Recommended Universities, Revision Requests, and Reviews).
* **Payment Settlement Rules**: Wallet logs, orders, payout configurations, withdrawal submissions, and 15-day hold commission settlements are fully coded in the backend viewsets.
* **Marketplace Operations**: Marketplace posts and quotations models and viewsets are fully operational.
* **Moderation Subsystem**: Key-term matching logic, auto-flagging, moderation incident logs, and account ban flags are fully coded.

### Partial / Needs Polish
* **Payment Gateway Wiring**: SurjoPay checkout session handles local redirect loops and callback stubs; must configure active production API endpoints.
* **Email & SMS Delivery**: The system uses console backends and logical true/false SMS mocks; requires configuring real SMTP servers and an SMS gateway provider API.
* **PDF Exporter**: A placeholder PDF service returns text bytes; requires wiring a library (e.g., Weasyprint or ReportLab) to output PDF binaries from rendered report HTML.

### Missing / Planned / Needs Verification
* **Production Build Verification**: The Decoupled App Router setup and MySQL 8 volume configurations need validation under high-concurrency production deployments.
* **Real-time Notifications**: Background notifications (email, SMS, or in-app alerts) for new assessment requests or quotation replies are planned but lack persistent queue storage.

---

## 6. Suggested Improvements

### UI/UX Improvements
* **Professional Assessment Workspace**: Versioned, category-specific guided reports with structured fields, autosave, validation, admin QA, immutable submission snapshots, approved-student visibility, and branded PDF export.
* **Platform Notifications Center**: Add an in-app notification bell with real-time alerts to notify students instantly when reports are ready or revision requests are resolved.

### Technical Improvements
* **Production Email & SMS Gateway Integration**: Replace console/mock stubs with production integrations (e.g., Twilio/Bulksms for SMS, SendGrid/SES for SMTP email).
* **PDF Exporter Engine**: WeasyPrint-based A4 report generation with cover pages, contents, repeating headers/footers, page numbers, confidentiality notices, and snapshot-backed output.
* **API Throttling & Security**: Implement rate limiting on sensitive authentication routes (`/api/auth/login/` and `/api/auth/register/start/`) to prevent brute-force attacks.

### Business/User Flow Improvements
* **Escrow Settlement Rules**: Allow custom configurations for the 15-day escrow hold duration depending on user tier or service category.
* **Pre-Consultation Chat**: Add a messaging component enabling students and consultants to exchange clarifying details before an assessment request is formally accepted or rejected.

### Documentation Improvements
* **Postman/API Spec Collection**: Create a swagger/openapi schema configuration to document and test all backend endpoints under `/api/`.
* **Migration Runbook**: Compile a specific debugging runbook for the V2 data migrator script to help resolve edge-case SQL import issues.

---

## 7. Feedback & Feature Request Section

Reviewers can utilize the following table format to record their feedback, bug findings, or future feature requests during the verification phase:

| Feedback ID | Related Feature ID | Feedback Type | Comment | Priority | Decision | Status |
| ----------- | ------------------ | ------------- | ------- | -------- | -------- | ------ |
| *Example-01*| *F-041*            | *Bug*         | *SurjoPay checkout doesn't parse API error responses.* | *High*   | *Accept* | *Open* |
|             |                    |               |         |          |          |        |
|             |                    |               |         |          |          |        |

*Feedback Type options: Bug, UI/UX Improvement, New Feature Request, Business Logic Change, Performance Issue, Security Concern, Question*

---

## 8. Future Roadmap

| Phase | Focus Area | Suggested Features / Work |
| ----- | ---------- | ------------------------- |
| **Phase 1: MVP Finalization** | Integration Wiring | Complete SMTP email settings, integrate Twilio/local SMS API, write the HTML-to-PDF rendering utility, and plug production SurjoPay credentials. |
| **Phase 2: Feedback Updates** | UI/UX & Flow Polish | Implement the pre-consultation chat room, add a real-time report editor preview, and support in-app notifications. |
| **Phase 3: Advanced Features** | Agency & Marketplace | Introduce agency team permission controls, team performance metrics, and advanced catalog search filtering. |
| **Phase 4: Scaling & Security** | Optimization | Add API endpoint caching for catalog listings, enable rate limiting, and configure daily automated DB backups. |

---

## 9. Technical Notes

* **Frontend Framework**: Next.js 16+ (using React 19, TypeScript, App Router, Tailwind CSS, Framer Motion, and shadcn-style component primitives).
* **Backend Framework**: Django REST Framework (DRF) 3.16+ running on Django 5.2+ (Python 3.12+).
* **Database & ORM**: MySQL 8.x database configured using the Django object-relational mapper (ORM) with transaction safety.
* **Authentication Method**: Cookie-based Session Authentication (`SessionAuthentication` in DRF) with client-readable `csrftoken` cookie and HTTP-only session cookies.
* **Major Integrations**:
  * **SurjoPay**: Mapped for invoice creation, checkout URL sessions, and instant callbacks.
  * **OTP Service**: Supports double-channel verification (email and SMS stubs).
  * **Legacy Migrator**: Python CLI SQL parser (`import_v2.py`) to transition Laravel V2 databases into normalized Django MySQL schemas.
* **Deployment Notes**: Docker-based compose configuration mapping separate `frontend` (Port 3000/3011), `backend` (Port 8000/8011), and `mysql` (Port 3307 local default) containers behind a production reverse-proxy (e.g., FASTPANEL on Ports 80 and 443).
