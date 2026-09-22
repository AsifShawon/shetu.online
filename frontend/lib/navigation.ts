import type { Route } from "next";

type NavigationItem = {
  label: string;
  href: Route;
};

export const publicNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Consultants", href: "/consultants" },
  { label: "Study Abroad", href: "/study-abroad" },
  { label: "Student Posts", href: "/student-post" },
  { label: "Courses", href: "/courses" },
  { label: "Contact", href: "/contact" }
] as const satisfies ReadonlyArray<NavigationItem>;

export const dashboardNavigation = {
  student: [
    { label: "Overview", href: "/dashboard/student" },
    { label: "Profile", href: "/dashboard/student/last-education" as Route },
    { label: "Choices", href: "/dashboard/student/choices" },
    { label: "Assessments", href: "/dashboard/student/assessments" },
    { label: "Saved Consultants", href: "/dashboard/student/saved-consultants" as Route },
    { label: "Wallet", href: "/dashboard/student/wallet" },
    { label: "Posts", href: "/dashboard/student/posts" },
    { label: "Quotations", href: "/dashboard/student/quotations" }
  ],
  consultant: [
    { label: "Overview", href: "/dashboard/consultant" },
    { label: "Profile", href: "/dashboard/consultant/profile" },
    { label: "Services", href: "/dashboard/consultant/services" },
    { label: "Assessments", href: "/dashboard/consultant/assessments" },
    { label: "Saved Consultants", href: "/dashboard/consultant/saved-consultants" as Route },
    { label: "Reports", href: "/dashboard/consultant/reports" },
    { label: "Balance", href: "/dashboard/consultant/balance" },
    { label: "Reviews", href: "/dashboard/consultant/reviews" }
  ],
  agency: [
    { label: "Overview", href: "/dashboard/agency" },
    { label: "Profile", href: "/dashboard/agency/profile" },
    { label: "Consultants", href: "/dashboard/agency/consultants" },
    { label: "Services", href: "/dashboard/agency/services" },
    { label: "Saved Consultants", href: "/dashboard/agency/saved-consultants" as Route },
    { label: "Countries", href: "/dashboard/agency/countries" },
    { label: "Gallery", href: "/dashboard/agency/gallery" },
    { label: "Transactions", href: "/dashboard/agency/transactions" }
  ],
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Content", href: "/admin/content" },
    { label: "Catalog", href: "/admin/catalog" },
    { label: "Assessment Reports", href: "/admin/assessment-reports" as Route },
    { label: "Refund Requests", href: "/admin/refund-requests" as Route },
    { label: "Moderation", href: "/admin/moderation" as Route },
    { label: "Verification", href: "/admin/verification" },
    { label: "Training", href: "/admin/training" },
    { label: "Transactions", href: "/admin/transactions" }
  ]
} as const satisfies Record<string, ReadonlyArray<NavigationItem>>;
