import { notFound } from "next/navigation";

import { SERVER_API_BASE_URL } from "@/lib/api/server";

interface EducationalInfo {
  id: number;
  title: string;
  institution_name: string;
  location: string;
  next_batch: string | null;
  entry_score: string;
  course_name: string;
  budget: string;
  scholarship_available: boolean;
  scholarship_percentage: string;
  card_banner: string | null;
  country_id: number;
}

interface PageContent {
  headline: string;
  head_description: string;
  banner_image: string | null;
  living_cost: string;
  academic_intake: string;
  deadline: string;
  popular_programs_text: string;
  popular_program_names: string[];
}

interface WhyPoint { id: number; point: string; point_detail: string }
interface TopUniversity { id: number; institution: string; short_description: string; ranking: string }
interface VisaItem { id: number; text: string }
interface ScholarshipItem { id: number; text: string }

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 120 } });
    if (!res.ok) return {} as T;
    return res.json();
  } catch {
    return {} as T;
  }
}

async function fetchArray<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function EducationalInfoPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const info = await fetchJson<EducationalInfo>(`/api/catalog/educational-info/${id}/`);
  if (!info?.id) notFound();

  return (
    <section className="py-16 md:py-20">
      <div className="legacy-container">
        {/* Banner */}
        {info.card_banner && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img src={info.card_banner} alt={info.title} className="h-72 w-full object-cover" />
          </div>
        )}

        <div className="legacy-panel p-8 md:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-[var(--legacy-secondary)]">
            Educational Information
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-[var(--legacy-primary)]">{info.title}</h1>
          <p className="mt-2 text-lg text-[var(--legacy-muted)]">{info.institution_name} — {info.location}</p>

          {/* Quick Facts */}
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: "Course", value: info.course_name },
              { label: "Next Batch", value: info.next_batch ?? "TBD" },
              { label: "Entry Score", value: info.entry_score },
              { label: "Budget", value: info.budget ? `BDT ${info.budget}` : "—" }
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-sm font-bold text-[var(--legacy-muted)]">{label}</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--legacy-primary)]">{value}</p>
              </div>
            ))}
          </div>

          {info.scholarship_available && (
            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <i className="fa-solid fa-award mr-2" />
              Scholarship available — up to {info.scholarship_percentage}% funding
            </div>
          )}
        </div>

        {/* Apply CTA */}
        <div className="mt-8 legacy-panel p-8 text-center">
          <h2 className="text-2xl font-extrabold text-[var(--legacy-primary)]">Interested in this program?</h2>
          <p className="mt-3 text-[var(--legacy-muted)]">Connect with a Shetu consultant who can guide your application.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a href="/consultants" className="legacy-primary-btn">
              Find a Consultant
            </a>
            <a href="/study-abroad" className="legacy-outline-btn">
              Submit Study Enquiry
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
