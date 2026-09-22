import type { Route } from "next";

export type DashboardRole = "student" | "consultant" | "agency";
export type DashboardSection =
  | "overview"
  | "profile"
  | "education"
  | "experience"
  | "choices"
  | "assessments"
  | "requests"
  | "wallet"
  | "posts"
  | "quotations"
  | "saved"
  | "services"
  | "reports"
  | "balance"
  | "reviews"
  | "training"
  | "consultants"
  | "countries"
  | "gallery"
  | "transactions";

export type AdminSection =
  | "overview"
  | "content"
  | "catalog"
  | "packages"
  | "verification"
  | "training"
  | "transactions";

export type NavItem = { key: DashboardSection | AdminSection; label: string; href: Route };
export type SummaryCard = { label: string; value: string; icon: string };
export type ActionLink = { label: string; href: Route; icon: string };
export type InsightCard = { title: string; description: string; meta?: string; accent?: string };

export type DashboardPage =
  | { layout: "overview"; welcomeTitle: string; welcomeText: string; primaryCards: InsightCard[]; secondaryCards?: InsightCard[] }
  | { layout: "table"; title: string; subtitle: string; actionLabel?: string; columns: string[]; rows: string[][] }
  | {
      layout: "form";
      title: string;
      subtitle: string;
      fields: Array<{ label: string; value: string; wide?: boolean }>;
      sideCard: { title: string; lines: string[]; action: string };
    }
  | { layout: "gallery"; title: string; subtitle: string; items: Array<{ title: string; image: string }> }
  | { layout: "report"; title: string; subtitle: string; timeline: string[]; blocks: Array<{ title: string; body: string }> };

export type AdminPage =
  | { layout: "overview"; welcomeTitle: string; welcomeText: string; primaryCards: InsightCard[]; secondaryCards?: InsightCard[] }
  | { layout: "table"; title: string; subtitle: string; actionLabel?: string; columns: string[]; rows: string[][] }
  | {
      layout: "form";
      title: string;
      subtitle: string;
      fields: Array<{ label: string; value: string; wide?: boolean }>;
      sideCard: { title: string; lines: string[]; action: string };
    }
  | {
      layout: "cards";
      title: string;
      subtitle: string;
      cards: Array<{ name: string; badge: string; price: string; description: string; points: string[]; featured?: boolean }>;
    };

export type RoleConfig = {
  roleLabel: string;
  userName: string;
  logo: string;
  heroImage: string;
  accentClass: string;
  summary: SummaryCard[];
  actions: ActionLink[];
  nav: NavItem[];
  badges: string[];
  wallet: string;
  overviewTitle: string;
};

export const adminNavigation: NavItem[] = [
  { key: "overview", label: "Dashboard", href: "/admin" },
  { key: "catalog", label: "Educational Info", href: "/admin/catalog" },
  { key: "content", label: "Content", href: "/admin/content" },
  { key: "packages", label: "Pro-Consultants", href: "/admin/packages" },
  { key: "verification", label: "Verified-Consultants", href: "/admin/verification" },
  { key: "training", label: "Trainings", href: "/admin/training" },
  { key: "transactions", label: "Transaction", href: "/admin/transactions" }
];

const studentNav: NavItem[] = [
  { key: "overview", label: "Dashboard", href: "/dashboard/student" },
  { key: "profile", label: "Update Profile", href: "/dashboard/student/profile" as Route },
  { key: "choices", label: "Your Choice", href: "/dashboard/student/choices" },
  { key: "assessments", label: "Service Request", href: "/dashboard/student/assessments" },
  { key: "saved", label: "Saved Consultants", href: "/dashboard/student/saved-consultants" as Route },
  { key: "wallet", label: "Balance", href: "/dashboard/student/wallet" },
  { key: "posts", label: "Your Post", href: "/dashboard/student/posts" },
  { key: "quotations", label: "Quotations", href: "/dashboard/student/quotations" }
];

const consultantNav: NavItem[] = [
  { key: "overview", label: "Dashboard", href: "/dashboard/consultant" },
  { key: "services", label: "My services", href: "/dashboard/consultant/services" },
  { key: "requests", label: "Transactions", href: "/dashboard/consultant/requests" as Route },
  { key: "saved", label: "Saved Consultants", href: "/dashboard/consultant/saved-consultants" as Route },
  { key: "balance", label: "Balance", href: "/dashboard/consultant/balance" },
  { key: "reviews", label: "Reviews", href: "/dashboard/consultant/reviews" },
  { key: "reports", label: "Reports", href: "/dashboard/consultant/reports" },
  { key: "education", label: "My Education", href: "/dashboard/consultant/education" as Route },
  { key: "training", label: "Training Course", href: "/dashboard/consultant/training" as Route },
  { key: "profile", label: "Update Profile", href: "/dashboard/consultant/profile" },
  { key: "experience", label: "Work Experience", href: "/dashboard/consultant/experience" as Route }
];

const agencyNav: NavItem[] = [
  { key: "overview", label: "Dashboard", href: "/dashboard/agency" },
  { key: "profile", label: "Agency Profile", href: "/dashboard/agency/profile" },
  { key: "services", label: "Agency Service", href: "/dashboard/agency/services" },
  { key: "saved", label: "Saved Consultants", href: "/dashboard/agency/saved-consultants" as Route },
  { key: "countries", label: "Agency Country", href: "/dashboard/agency/countries" },
  { key: "consultants", label: "Agency Consultant", href: "/dashboard/agency/consultants" },
  { key: "gallery", label: "Agency Gallery", href: "/dashboard/agency/gallery" },
  { key: "transactions", label: "Transactions", href: "/dashboard/agency/transactions" }
];

export const roleConfigs: Record<DashboardRole, RoleConfig> = {
  student: {
    roleLabel: "Student Dashboard",
    userName: "Asif Bhuiyan",
    logo: "/shetu_logo.jpeg",
    heroImage: "/legacy/Frontend/assets/img/bg/student_bg.png",
    accentClass: "student",
    wallet: "৳ 12,500",
    badges: ["Verified", "Student"],
    overviewTitle: "Choices, assessments, wallet, and consultant access.",
    summary: [
      { label: "Total Request", value: "06", icon: "/legacy/Frontend/assets/icons/file.png" },
      { label: "Complete Request", value: "06", icon: "/legacy/Frontend/assets/icons/healthy.png" },
      { label: "Active Consultants", value: "06", icon: "/legacy/Frontend/assets/icons/check.png" }
    ],
    actions: [
      { label: "Choice Create", href: "/dashboard/student/choices/create" as Route, icon: "/legacy/Frontend/assets/icons/edit.png" },
      { label: "Get Assessment", href: "/dashboard/student/assessments", icon: "/legacy/Frontend/assets/icons/registered-document.png" },
      { label: "Send Request", href: "/dashboard/consultants-of-eduwise" as Route, icon: "/legacy/Frontend/assets/icons/send.png" },
      { label: "Last Education", href: "/dashboard/student/last-education" as Route, icon: "/legacy/Frontend/assets/icons/graduate-cap.png" }
    ],
    nav: studentNav
  },
  consultant: {
    roleLabel: "Consultant Dashboard",
    userName: "Asif Bhuiyan",
    logo: "/shetu_logo.jpeg",
    heroImage: "/legacy/Frontend/assets/img/bg/student_bg.png",
    accentClass: "consultant",
    wallet: "৳ 28,750",
    badges: ["Verified", "Pro-Consultant"],
    overviewTitle: "Services, requests, education, experience, earnings, and reviews.",
    summary: [
      { label: "Earnings", value: "৳ 0", icon: "/legacy/Frontend/assets/icons/file.png" },
      { label: "Total Request", value: "0", icon: "/legacy/Frontend/assets/icons/healthy.png" },
      { label: "Completed", value: "0", icon: "/legacy/Frontend/assets/icons/check.png" },
      { label: "Reviews", value: "0", icon: "/legacy/Frontend/assets/icons/check.png" }
    ],
    actions: [
      { label: "Create Service", href: "/dashboard/consultant/services/create" as Route, icon: "/legacy/Frontend/assets/icons/services.png" },
      { label: "My Education", href: "/dashboard/consultant/education" as Route, icon: "/legacy/Frontend/assets/icons/graduate-cap.png" },
      { label: "Work Experience", href: "/dashboard/consultant/experience" as Route, icon: "/legacy/Frontend/assets/icons/experience.png" },
      { label: "Request", href: "/dashboard/consultant/requests" as Route, icon: "/legacy/Frontend/assets/icons/filePending.png" }
    ],
    nav: consultantNav
  },
  agency: {
    roleLabel: "Agency Dashboard",
    userName: "Asif Bhuiyan",
    logo: "/shetu_logo.jpeg",
    heroImage: "/legacy/Frontend/assets/img/bg/student_bg.png",
    accentClass: "agency",
    wallet: "৳ 43,200",
    badges: ["Verified", "Agency"],
    overviewTitle: "Consultants, services, countries, gallery, and transactions.",
    summary: [],
    actions: [
      { label: "Agency Consultant", href: "/dashboard/agency/consultants", icon: "/legacy/Frontend/assets/icons/profile.png" },
      { label: "Agency Profile", href: "/dashboard/agency/profile", icon: "/legacy/Frontend/assets/icons/agency_profile.png" },
      { label: "Transactions", href: "/dashboard/agency/transactions", icon: "/legacy/Frontend/assets/icons/transaction-success.png" }
    ],
    nav: agencyNav
  }
};

const studentPages: Partial<Record<DashboardSection, DashboardPage>> = {
  overview: {
    layout: "overview",
    welcomeTitle: "Welcome back to your study dashboard.",
    welcomeText:
      "Track your profile completion, wallet movement, current requests, and recent consultant activity from a layout that follows the old Shetu student panel.",
    primaryCards: [
      { title: "Your Profile", description: "Profile information and qualification completion are shown with the old progress-circle style.", meta: "Completion: 78%" },
      { title: "Your Account", description: "Balance, last deposit, and transaction totals remain visible in the same quick-account pattern.", meta: "Balance: ৳ 12,500" },
      { title: "Consultant Quick View", description: "Pro, verified, and regular consultants stay visible as short cards for quick service requests.", accent: "warm" }
    ],
    secondaryCards: [
      { title: "Latest Assessment", description: "Australia MBA assessment is pending consultant review.", meta: "Updated 2 hours ago" },
      { title: "Newest Quotation", description: "3 consultants responded to your Canada undergraduate post.", meta: "3 active quotes" }
    ]
  },
  profile: {
    layout: "form",
    title: "Update Last Education",
    subtitle: "This keeps the old two-column form rhythm for academic profile data.",
    fields: [
      { label: "Title of Your Education", value: "BSc in Computer Science" },
      { label: "Group/Department", value: "Science" },
      { label: "Start Date", value: "2021-01-15" },
      { label: "End Date", value: "2024-01-15" },
      { label: "Duration", value: "4 Years" },
      { label: "Result", value: "CGPA 3.72" },
      { label: "Institution", value: "University of Dhaka", wide: true },
      { label: "Certificate/Documents", value: "marksheet-final.pdf", wide: true }
    ],
    sideCard: { title: "Profile Information", lines: ["Completion: 78%", "Passport: Added", "Academic info: Complete", "Target intake: Fall 2027"], action: "Save and Continue" }
  },
  choices: {
    layout: "table",
    title: "Your Choice",
    subtitle: "Country and university preference list in the old dashboard table style.",
    actionLabel: "Add New Choice",
    columns: ["#", "Country", "Subject", "Study Level", "Budget", "University", "Status", "Action"],
    rows: [
      ["1", "Canada", "Computer Science", "Bachelor", "৳ 18L", "Toronto", "Active", "Edit / Disable"],
      ["2", "Australia", "Data Science", "Masters", "৳ 22L", "Monash", "Active", "Edit / Disable"],
      ["3", "United Kingdom", "Business", "MBA", "৳ 25L", "Leeds", "Draft", "Edit / Publish"]
    ]
  },
  assessments: {
    layout: "table",
    title: "All Service Requests",
    subtitle: "Student service requests keep the old request list and status visibility.",
    actionLabel: "Find Consultants",
    columns: ["#", "Consultant", "Service", "Country", "Charge", "Requested", "Status", "Action"],
    rows: [
      ["1", "Mohammad Ilius Sagar", "Assessment", "New Zealand", "৳ 500", "26 Feb 2026", "Pending", "Open"],
      ["2", "Sarah Ahmed", "Visa Processing", "Australia", "৳ 600", "28 Feb 2026", "Accepted", "Open"],
      ["3", "David Hasan", "Course Selection", "Canada", "৳ 450", "01 Mar 2026", "Completed", "Review"]
    ]
  },
  wallet: {
    layout: "table",
    title: "Balance and Transactions",
    subtitle: "Wallet top-up and transaction history stay in the same practical table-first layout.",
    actionLabel: "Add Money",
    columns: ["#", "Type", "Amount", "Gateway", "Reference", "Date", "Status", "Action"],
    rows: [
      ["1", "Top Up", "৳ 5,000", "SurjoPay", "SP-560122", "10 Mar 2026", "Success", "View"],
      ["2", "Assessment", "-৳ 500", "Wallet", "RQ-2043", "12 Mar 2026", "Settled", "View"],
      ["3", "Top Up", "৳ 8,000", "SurjoPay", "SP-560991", "18 Mar 2026", "Success", "View"]
    ]
  },
  posts: {
    layout: "table",
    title: "Your Post",
    subtitle: "Student posts follow the old searchable listing with quotation access.",
    actionLabel: "Create Post",
    columns: ["#", "Country", "Title", "Description", "Subject", "Study Level", "Status", "Action"],
    rows: [
      ["1", "Canada", "Looking for Fall 2027 intake", "Need affordable university options", "Computer Science", "Bachelor", "Published", "Edit / Quotes"],
      ["2", "Australia", "MBA option", "Need scholarship guidance", "Business", "Masters", "Draft", "Edit / Publish"],
      ["3", "USA", "Visa help required", "Need document checklist", "Public Health", "Masters", "Published", "Edit / Quotes"]
    ]
  },
  quotations: {
    layout: "table",
    title: "Quotations",
    subtitle: "Consultant quotations remain grouped against each student post.",
    columns: ["#", "Post", "Consultant", "Country", "Quoted Service", "Quoted On", "Status", "Action"],
    rows: [
      ["1", "Canada Fall Intake", "Mohammad Ilius Sagar", "Canada", "Assessment + Admission", "21 Mar 2026", "Received", "Open"],
      ["2", "Australia MBA", "Rafat Hossain", "Australia", "Visa Processing", "22 Mar 2026", "Received", "Open"],
      ["3", "USA Visa Help", "Nadia Rahman", "USA", "Checklist Review", "24 Mar 2026", "Seen", "Open"]
    ]
  }
};

const consultantPages: Partial<Record<DashboardSection, DashboardPage>> = {
  overview: {
    layout: "overview",
    welcomeTitle: "Manage your services and student requests.",
    welcomeText:
      "The consultant overview mirrors the old Laravel dashboard: summary cards on top, action buttons in the middle, then profile, balance, and student-post blocks below.",
    primaryCards: [
      { title: "Your Profile", description: "Qualification, training, and experience completion use the same progress-card feel.", meta: "Completion: 86%" },
      { title: "Your Account", description: "Balance, last transaction, and payout activity are shown in the same wallet summary block.", meta: "Balance: ৳ 28,750" },
      { title: "Student Post", description: "Public student posts remain visible so consultants can send quotations from the dashboard.", accent: "warm" }
    ],
    secondaryCards: [
      { title: "Pending Request", description: "2 assessment requests require response.", meta: "Pending" },
      { title: "Latest Review", description: "New 5-star review from a New Zealand student.", meta: "Today" }
    ]
  },
  profile: {
    layout: "form",
    title: "Consultant Profile and Documents",
    subtitle: "Old consultant dashboard behavior: document-heavy form plus profile completion card.",
    fields: [
      { label: "Full Name", value: "Asif Bhuiyan" },
      { label: "Professional Title", value: "Senior Education Consultant" },
      { label: "Primary Country", value: "New Zealand" },
      { label: "Years of Experience", value: "6 Years" },
      { label: "Qualification", value: "MBA in International Education" },
      { label: "Training", value: "Visa Documentation Workshop" },
      { label: "Verification Status", value: "Verified" },
      { label: "About", value: "Focused on study visa, course selection, and scholarship planning.", wide: true }
    ],
    sideCard: { title: "Verification and Completion", lines: ["Completion: 86%", "Verification: Verified", "Pro-Consultant: Active", "Bank account: Added"], action: "Update Profile" }
  },
  services: {
    layout: "table",
    title: "Your Service Details",
    subtitle: "Services stay in the old searchable management table with publish/disable/delete actions.",
    actionLabel: "Create Service",
    columns: ["#", "Title", "Description", "Country", "Services", "Subject", "Study Level", "Charge", "Duration", "Status", "Action"],
    rows: [
      ["1", "New Zealand Assessment", "Course selection and profile review", "New Zealand", "Assessment", "Agriculture", "Bachelor", "৳ 500", "8 Days", "Active", "Edit / Disable"],
      ["2", "Visa Processing", "Visa file preparation support", "Australia", "Visa Processing", "Business", "Masters", "৳ 600", "10 Days", "Inactive", "Edit / Enable"],
      ["3", "Admission Help", "Admission application assistance", "Canada", "Admission", "Computer Science", "Masters", "৳ 550", "7 Days", "Active", "Edit / Disable"]
    ]
  },
  assessments: {
    layout: "table",
    title: "Assessment Requests",
    subtitle: "Pending, accepted, completed, and rejected service requests use the same operational list style.",
    columns: ["#", "Student", "Country", "Service", "Charge", "Requested On", "Status", "Action"],
    rows: [
      ["1", "Nusrat Jahan", "New Zealand", "Assessment", "৳ 500", "26 Feb 2026", "Pending", "Open"],
      ["2", "Mahin Ahmed", "Australia", "Visa Processing", "৳ 600", "28 Feb 2026", "Accepted", "Open"],
      ["3", "Shawon Islam", "Canada", "Admission", "৳ 550", "01 Mar 2026", "Completed", "Open"]
    ]
  },
  reports: {
    layout: "report",
    title: "Assessment Report",
    subtitle: "This follows the old report editor pattern with fixed timeline navigation and section cards.",
    timeline: ["Recommended Universities", "Language Proficiency", "Health Insurance", "Visa Process", "Application Processing", "Checklist", "Additional Comments"],
    blocks: [
      { title: "Recommended Universities", body: "University, course, tuition, IELTS, scholarship, visa type, and processing estimates are listed in a table-first editing workflow." },
      { title: "Language Proficiency", body: "IELTS score, accepted alternatives, and English preparation notes stay grouped together." },
      { title: "Visa and Immigration", body: "Visa type, required documents, processing time, and interview preparation remain separate report sections." },
      { title: "Checklist and Recommendations", body: "The student-facing next steps remain explicit and ordered, matching the Laravel report sequence." }
    ]
  },
  balance: {
    layout: "table",
    title: "Consultant Transactions",
    subtitle: "Payout, bank account, and transaction history keep the old list-heavy dashboard style.",
    actionLabel: "Withdraw Request",
    columns: ["#", "Type", "Amount", "Source", "Requested On", "Processed On", "Status", "Action"],
    rows: [
      ["1", "Assessment Earning", "৳ 500", "Assessment #2043", "10 Mar 2026", "12 Mar 2026", "Settled", "View"],
      ["2", "Withdrawal", "-৳ 5,000", "Bank Transfer", "20 Mar 2026", "21 Mar 2026", "Paid", "View"],
      ["3", "Assessment Earning", "৳ 600", "Assessment #2110", "22 Mar 2026", "22 Mar 2026", "Pending", "View"]
    ]
  },
  reviews: {
    layout: "table",
    title: "Reviews",
    subtitle: "Consultant reviews remain visible in a simple table with ratings and student context.",
    columns: ["#", "Student", "Service", "Country", "Rating", "Comment", "Date", "Action"],
    rows: [
      ["1", "Nusrat Jahan", "Assessment", "New Zealand", "5.0", "Very clear guidance and fast response.", "18 Mar 2026", "Reply"],
      ["2", "Shawon Islam", "Admission", "Canada", "4.5", "Helpful suggestions for universities.", "20 Mar 2026", "Reply"],
      ["3", "Raisa Noor", "Visa Processing", "Australia", "5.0", "Professional and detailed support.", "24 Mar 2026", "Reply"]
    ]
  }
};

const agencyPages: Partial<Record<DashboardSection, DashboardPage>> = {
  overview: {
    layout: "overview",
    welcomeTitle: "Run agency operations from the legacy dashboard flow.",
    welcomeText:
      "The agency panel keeps the banner-style profile header, compact action strip, and white content cards used in the Laravel version.",
    primaryCards: [
      { title: "Agency Profile", description: "Mission, vision, banner, and core company profile remain grouped in a single primary card.", meta: "Completion: 81%" },
      { title: "Your Account", description: "Agency earnings and transaction visibility stay in the familiar quick-account box.", meta: "Balance: ৳ 43,200" },
      { title: "Agency Activity", description: "Consultants, services, and countries are grouped as operational quick views.", accent: "warm" }
    ],
    secondaryCards: [
      { title: "Active Consultants", description: "8 consultants are currently attached to this agency.", meta: "8 members" },
      { title: "Published Services", description: "12 agency services are live across 6 countries.", meta: "12 services" }
    ]
  },
  profile: {
    layout: "form",
    title: "Agency Profile",
    subtitle: "The profile editor follows the old content-heavy agency form structure.",
    fields: [
      { label: "Agency Name", value: "Shetu Global Partners" },
      { label: "Email", value: "agency@shetu.com" },
      { label: "Phone", value: "+8801897621272" },
      { label: "Address", value: "Dhaka, Bangladesh" },
      { label: "Mission", value: "Support students with transparent study-abroad planning.", wide: true },
      { label: "Vision", value: "Build trusted global education access from Bangladesh.", wide: true },
      { label: "Policy", value: "Student-first, transparent, documented processing.", wide: true },
      { label: "Map and Office", value: "Main office map and Google location configured.", wide: true }
    ],
    sideCard: { title: "Agency Assets", lines: ["Banner: Added", "Logo: Added", "Gallery: 14 items", "Countries: 6 active"], action: "Update Agency" }
  },
  consultants: {
    layout: "table",
    title: "Agency Consultants",
    subtitle: "Consultant management follows the old compact table and action-button format.",
    actionLabel: "Add Consultant",
    columns: ["#", "Consultant", "Email", "Country", "Experience", "Verification", "Status", "Action"],
    rows: [
      ["1", "Mohammad Ilius Sagar", "ilius@shetu.com", "New Zealand", "5 Years", "Verified", "Active", "Edit / Disable"],
      ["2", "Rafat Hossain", "rafat@shetu.com", "Australia", "4 Years", "Pending", "Active", "Edit / Disable"],
      ["3", "Nadia Rahman", "nadia@shetu.com", "Canada", "6 Years", "Verified", "Inactive", "Edit / Enable"]
    ]
  },
  services: {
    layout: "table",
    title: "Agency Services",
    subtitle: "Agency service list mirrors the Laravel dashboard table with quick search and action buttons.",
    actionLabel: "Add New",
    columns: ["#", "Service Name", "Service Title", "Description", "Thumbnail", "Status", "Action"],
    rows: [
      ["1", "Assessment", "UK Admission Help", "University shortlisting and application help", "Image", "Active", "Edit / Toggle / Delete"],
      ["2", "Visa Processing", "Australia Visa Pack", "Documentation and interview support", "Image", "Active", "Edit / Toggle / Delete"],
      ["3", "Scholarship Guide", "Canada Funding Plan", "Scholarship and budget strategy", "Image", "Inactive", "Edit / Toggle / Delete"]
    ]
  },
  countries: {
    layout: "table",
    title: "Agency Countries",
    subtitle: "Destination management stays in a simple searchable table.",
    actionLabel: "Add Country",
    columns: ["#", "Country", "Flag", "Programs", "Consultants", "Status", "Action"],
    rows: [
      ["1", "Australia", "Flag", "12", "3", "Active", "Edit / Delete"],
      ["2", "Canada", "Flag", "18", "2", "Active", "Edit / Delete"],
      ["3", "United Kingdom", "Flag", "9", "3", "Draft", "Edit / Publish"]
    ]
  },
  gallery: {
    layout: "gallery",
    title: "Agency Gallery",
    subtitle: "The gallery area keeps the old upload-first media management feel.",
    items: [
      { title: "Office Exterior", image: "/legacy/Frontend/assets/img/bg/student_bg.png" },
      { title: "Student Seminar", image: "/legacy/Frontend/assets/img/bg/student_bg.png" },
      { title: "Visa Workshop", image: "/legacy/Frontend/assets/img/bg/student_bg.png" },
      { title: "Counselling Booth", image: "/legacy/Frontend/assets/img/bg/student_bg.png" }
    ]
  },
  transactions: {
    layout: "table",
    title: "Agency Transactions",
    subtitle: "Earnings and consultant-linked transaction visibility stay consistent with the old dashboard.",
    columns: ["#", "Type", "Amount", "Consultant", "Reference", "Date", "Status", "Action"],
    rows: [
      ["1", "Assessment Share", "৳ 1,250", "Mohammad Ilius Sagar", "AG-2204", "12 Mar 2026", "Settled", "View"],
      ["2", "Assessment Share", "৳ 980", "Nadia Rahman", "AG-2240", "18 Mar 2026", "Pending", "View"],
      ["3", "Withdrawal", "-৳ 10,000", "Agency", "WD-004", "25 Mar 2026", "Paid", "View"]
    ]
  }
};

export const rolePages: Record<DashboardRole, Partial<Record<DashboardSection, DashboardPage>>> = {
  student: studentPages,
  consultant: consultantPages,
  agency: agencyPages
};

export const adminPages: Record<AdminSection, AdminPage> = {
  overview: {
    layout: "overview",
    welcomeTitle: "Platform operations overview.",
    welcomeText:
      "The admin area follows the old AdminLTE pattern: sidebar navigation, compact navbar, colored stat boxes, and card-based management screens.",
    primaryCards: [
      { title: "Message Request", description: "48 contact messages in the queue.", meta: "48", accent: "info" },
      { title: "Testimonials", description: "12 testimonials currently active.", meta: "12", accent: "success" },
      { title: "Services", description: "26 live services across the catalog.", meta: "26", accent: "warning" },
      { title: "All Slider", description: "6 active homepage sliders configured.", meta: "6", accent: "danger" }
    ],
    secondaryCards: [
      { title: "Contact Request Chart", description: "Monthly message trend is shown as a card block in V3 for now." },
      { title: "Testimonials Chart", description: "Secondary analytics region reserved for Laravel-like dashboard widgets." }
    ]
  },
  content: {
    layout: "form",
    title: "Manage Configurations",
    subtitle: "This keeps the old configuration screen pattern with basic info, media, social links, and company body content.",
    fields: [
      { label: "Company Name", value: "Shetu" },
      { label: "Company Email", value: "shetu@gmail.com" },
      { label: "Company Phone", value: "018976-21272" },
      { label: "Promo Video", value: "https://youtube.com/watch?v=demo" },
      { label: "Facebook", value: "facebook.com/shetu" },
      { label: "Instagram", value: "instagram.com/shetu" },
      { label: "Company Address", value: "Dhaka, Bangladesh", wide: true },
      { label: "Company Details", value: "Study-abroad consulting, educational information, courses, and consultant marketplace content.", wide: true }
    ],
    sideCard: { title: "Media and Social", lines: ["Logo: Configured", "Secondary logo: Configured", "Facebook: Linked", "YouTube: Linked"], action: "Save Configuration" }
  },
  catalog: {
    layout: "table",
    title: "Manage Country and Educational Catalog",
    subtitle: "The catalog area combines the old country index and educational data management style.",
    actionLabel: "Add New",
    columns: ["#", "Country", "Image", "Universities", "Courses", "Status", "Action"],
    rows: [
      ["1", "Australia", "Flag", "42", "120", "Active", "Toggle / Delete"],
      ["2", "Canada", "Flag", "51", "148", "Active", "Toggle / Delete"],
      ["3", "United Kingdom", "Flag", "36", "95", "Draft", "Toggle / Delete"]
    ]
  },
  packages: {
    layout: "cards",
    title: "Pro-Consultant Packages",
    subtitle: "Package management follows the public pricing-card feel with admin controls layered on top.",
    cards: [
      { name: "Premium", badge: "Best", price: "৳ 850 / month", description: "High visibility, pro badge, priority search placement.", points: ["Featured placement", "Priority service display", "Profile highlight", "Extended marketing reach"] },
      { name: "Standard", badge: "Popular", price: "৳ 650 / month", description: "Balanced package for active consultants.", points: ["Profile boost", "Service promotion", "Basic analytics", "Support access"] },
      { name: "Basic", badge: "Starter", price: "৳ 467 / month", description: "Entry-level paid package for new consultants.", points: ["Pro access", "Listing support", "Dashboard badge", "Basic visibility"], featured: true }
    ]
  },
  verification: {
    layout: "table",
    title: "Verification Requests",
    subtitle: "Admin verification queue stays close to the old pending-request management table.",
    columns: ["#", "Consultant", "Email", "Country", "Documents", "Requested On", "Status", "Action"],
    rows: [
      ["1", "Mohammad Ilius Sagar", "ilius@shetu.com", "New Zealand", "Complete", "20 Mar 2026", "Pending", "Review"],
      ["2", "Nadia Rahman", "nadia@shetu.com", "Canada", "Complete", "22 Mar 2026", "Pending", "Review"],
      ["3", "Rafat Hossain", "rafat@shetu.com", "Australia", "Partial", "24 Mar 2026", "Needs Update", "Review"]
    ]
  },
  training: {
    layout: "table",
    title: "Trainings",
    subtitle: "Training management uses the old searchable admin list structure.",
    actionLabel: "Add Training",
    columns: ["#", "Training", "Category", "Duration", "Instructor", "Price", "Status", "Action"],
    rows: [
      ["1", "Visa Documentation Masterclass", "Consultant", "6 Weeks", "Admin Team", "৳ 3,500", "Active", "Edit"],
      ["2", "Course Matching Workshop", "Consultant", "4 Weeks", "Catalog Team", "৳ 2,500", "Active", "Edit"],
      ["3", "Admission SOP Writing", "Student", "3 Weeks", "Content Team", "৳ 1,800", "Draft", "Edit"]
    ]
  },
  transactions: {
    layout: "table",
    title: "Transactions",
    subtitle: "Service charges, orders, wallet records, and payouts stay in an operational admin table.",
    columns: ["#", "Source", "User", "Amount", "Gateway", "Reference", "Date", "Status"],
    rows: [
      ["1", "Wallet Top Up", "Asif Bhuiyan", "৳ 5,000", "SurjoPay", "SP-560122", "10 Mar 2026", "Success"],
      ["2", "Course Order", "Shawon Islam", "৳ 2,500", "SurjoPay", "ORD-2201", "16 Mar 2026", "Paid"],
      ["3", "Withdrawal", "Mohammad Ilius Sagar", "৳ 5,000", "Bank", "WD-004", "25 Mar 2026", "Paid"]
    ]
  }
};
