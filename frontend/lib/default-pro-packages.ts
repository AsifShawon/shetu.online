export type DefaultProPackage = {
  id: number;
  name: string;
  level: string;
  package_type: "monthly" | "annual";
  duration_days: number;
  description: string;
  price: string;
  features: string[];
  status: "active";
};

export const DEFAULT_PRO_PACKAGES: DefaultProPackage[] = [
  {
    id: 1001,
    name: "Basic",
    level: "Ideal User",
    package_type: "monthly",
    duration_days: 30,
    description: "Starter access for new consultants getting set up.",
    price: "0",
    features: [
      "Unlimited personal files",
      "Email support",
      "CSV data export",
      "Basic analytics dashboard",
      "1,000 API calls per month",
    ],
    status: "active",
  },
  {
    id: 1002,
    name: "Professional",
    level: "For Consultants & Agency",
    package_type: "monthly",
    duration_days: 90,
    description: "Best-fit package for consultants managing active student leads.",
    price: "500",
    features: [
      "Up to 5 user accounts",
      "Team collaboration tools",
      "Custom dashboards",
      "Multiple data export formats",
      "Basic custom integrations",
    ],
    status: "active",
  },
  {
    id: 1003,
    name: "Organization",
    level: "For fast-growing businesses",
    package_type: "monthly",
    duration_days: 180,
    description: "Operational package for larger education teams and agencies.",
    price: "1000",
    features: [
      "Enterprise security suite",
      "Single Sign-On (SSO)",
      "Custom contract terms",
      "Dedicated phone support",
      "Custom integration support",
      "Compliance tools",
    ],
    status: "active",
  },
  {
    id: 2001,
    name: "Basic",
    level: "Ideal User",
    package_type: "annual",
    duration_days: 365,
    description: "Starter annual option for consultants who want long-term access.",
    price: "0",
    features: [
      "Unlimited personal files",
      "Email support",
      "CSV data export",
      "Basic analytics dashboard",
      "1,000 API calls per month",
    ],
    status: "active",
  },
  {
    id: 2002,
    name: "Professional",
    level: "For Consultants & Agency",
    package_type: "annual",
    duration_days: 90,
    description: "Popular annual-track package for growing consultant teams.",
    price: "500",
    features: [
      "Up to 5 user accounts",
      "Team collaboration tools",
      "Custom dashboards",
      "Multiple data export formats",
      "Basic custom integrations",
    ],
    status: "active",
  },
  {
    id: 2003,
    name: "Organization",
    level: "For fast-growing businesses",
    package_type: "annual",
    duration_days: 180,
    description: "Annual enterprise package for agencies handling larger operations.",
    price: "500",
    features: [
      "Enterprise security suite",
      "Single Sign-On (SSO)",
      "Custom contract terms",
      "Dedicated phone support",
      "Custom integration support",
      "Compliance tools",
    ],
    status: "active",
  },
];
