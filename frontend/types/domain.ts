export type Role = "student" | "consultant" | "agency" | "admin";

export interface StatCard {
  label: string;
  value: string;
  helper?: string;
}

export interface PageFeature {
  title: string;
  description: string;
}
