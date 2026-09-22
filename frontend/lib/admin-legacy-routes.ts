import type { AdminSectionKey } from "@/lib/admin-config";

export type AdminRouteMode = "list" | "form" | "upsert";

export interface AdminLegacyRouteConfig {
  section: AdminSectionKey;
  resourceKey: string;
  initialMode?: AdminRouteMode;
  listHref?: string;
  createHref?: string;
}

const legacyRoutes: Record<string, AdminLegacyRouteConfig> = {
  dashboard: {
    section: "overview",
    resourceKey: "",
    listHref: "/admin/dashboard",
  },
  eduinfo: {
    section: "catalog",
    resourceKey: "educational-info",
    listHref: "/admin/eduinfo",
    createHref: "/admin/eduinfo/create",
  },
  services: {
    section: "catalog",
    resourceKey: "service-categories",
    listHref: "/admin/services",
  },
  country: {
    section: "catalog",
    resourceKey: "countries",
    listHref: "/admin/country",
    createHref: "/admin/country/create",
  },
  course: {
    section: "catalog",
    resourceKey: "courses",
    listHref: "/admin/course",
    createHref: "/admin/course/create",
  },
  studylevel: {
    section: "catalog",
    resourceKey: "study-levels",
    listHref: "/admin/studylevel",
  },
  university: {
    section: "catalog",
    resourceKey: "universities",
    listHref: "/admin/university",
    createHref: "/admin/university/create",
  },
  "pro-user-package": {
    section: "packages",
    resourceKey: "pro-packages",
    listHref: "/admin/pro-user-package",
  },
  "verified-user-request": {
    section: "verification",
    resourceKey: "verification-requests",
    listHref: "/admin/verified-user-request",
  },
  "student-queries": {
    section: "content",
    resourceKey: "study-abroad-leads",
    listHref: "/admin/student-queries",
  },
  traininginfo: {
    section: "training",
    resourceKey: "trainings",
    listHref: "/admin/traininginfo",
    createHref: "/admin/traininginfo/create",
  },
  "user-service-charge": {
    section: "transactions",
    resourceKey: "service-charge-rules",
    listHref: "/admin/user-service-charge",
    createHref: "/admin/add-service-charge",
  },
  "add-service-charge": {
    section: "transactions",
    resourceKey: "service-charge-rules",
    initialMode: "form",
    listHref: "/admin/user-service-charge",
    createHref: "/admin/add-service-charge",
  },
  user: {
    section: "verification",
    resourceKey: "users",
    listHref: "/admin/user",
    createHref: "/admin/user/create",
  },
  slider: {
    section: "content",
    resourceKey: "sliders",
    listHref: "/admin/slider",
    createHref: "/admin/slider/create",
  },
  "company-details": {
    section: "content",
    resourceKey: "company-details",
    initialMode: "upsert",
    listHref: "/admin/company-details",
  },
  about: {
    section: "content",
    resourceKey: "about-sections",
    listHref: "/admin/about",
  },
  contact: {
    section: "content",
    resourceKey: "contact-submissions",
    listHref: "/admin/contact",
  },
  testimonials: {
    section: "content",
    resourceKey: "testimonials",
    listHref: "/admin/testimonials",
    createHref: "/admin/create/store/testimonials",
  },
  faq: {
    section: "content",
    resourceKey: "faqs",
    createHref: "/admin/create/store/faq",
    listHref: "/admin/faq",
  },
  schedule: {
    section: "transactions",
    resourceKey: "class-schedules",
    listHref: "/admin/schedule",
  },
  order: {
    section: "transactions",
    resourceKey: "orders",
    listHref: "/admin/order",
  },
  configer: {
    section: "content",
    resourceKey: "site-settings",
    initialMode: "upsert",
    listHref: "/admin/configer",
  },
  "terms-and-condition": {
    section: "content",
    resourceKey: "terms-documents",
    initialMode: "upsert",
    listHref: "/admin/terms-and-condition",
  },
};

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function resolveAdminLegacyRoute(slug: string): AdminLegacyRouteConfig | undefined {
  return legacyRoutes[normalizeSlug(slug)];
}
