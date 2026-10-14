import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsultantProfileShell } from "@/components/legacy/consultant-profile-shell";
import { SERVER_API_BASE_URL } from "@/lib/api/server";
import type { ConsultantService, PublicConsultantProfile } from "@/lib/api/consultants";
import { getMediaUrl } from "@/lib/api/client";

interface Review {
  id: number;
  consultant_id?: number;
  student_name?: string;
  review_message: string;
  review_rating: number;
  created_at?: string;
}

type FetchResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; message: string };

async function fetchServerJson<T>(path: string): Promise<FetchResult<T>> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { cache: "no-store" });
    if (!res.ok) {
      return { success: false, status: res.status, message: `Request failed with status ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, status: 503, message: error instanceof Error ? error.message : "Service Unavailable" };
  }
}

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function formatExperience(yearsCount?: number) {
  if (typeof yearsCount === "number" && yearsCount > 0) {
    return `${yearsCount} yrs`;
  }
  return "<1 yr";
}

function getServiceLabel(service: ConsultantService) {
  return service.service_category_names?.[0] || service.title || "Consulting";
}

export default async function ConsultantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const consultantId = Number(id);

  if (!Number.isFinite(consultantId) || consultantId <= 0) {
    notFound();
  }

  // 1. Fetch consultant identity independently
  const consultantResult = await fetchServerJson<PublicConsultantProfile>(
    `/api/consultants/public/${consultantId}/`
  );

  if (!consultantResult.success) {
    if (consultantResult.status === 404) {
      notFound();
    }
    // Return explicit error state for server outages instead of pretending the consultant doesn't exist
    return (
      <section className="legacy-consultant-profile-page">
        <div className="legacy-shell-container py-12 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
            <h2 className="text-lg font-bold">Failed to load consultant profile</h2>
            <p className="mt-2 text-sm text-red-600">
              We encountered a temporary server error while fetching this profile. Please try refreshing the page.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href={`/consultants-profile-details-view/${consultantId}`}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Retry
              </Link>
              <Link
                href="/consultants"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Back to Consultants
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const profile = consultantResult.data;

  // 2. Fetch only relevant services and reviews for this consultant
  const [servicesResult, reviewsResult] = await Promise.all([
    fetchServerJson<ConsultantService[]>(
      `/api/consultants/services/?scope=public&consultant_id=${consultantId}`
    ),
    fetchServerJson<Review[]>(`/api/assessments/reviews/?consultant_id=${consultantId}`),
  ]);

  const services = servicesResult.success
    ? servicesResult.data.filter((s) => s.status === "active")
    : [];
  const reviews = reviewsResult.success ? reviewsResult.data : [];

  const name = profile.name || `${profile.first_name} ${profile.last_name}`.trim() || "Consultant";
  const image = getMediaUrl(profile.image_url || profile.image) ?? "/legacy/no-profile-img.png";
  const isVerified = profile.verification_status === "accepted";
  const isPro = profile.role === "consultant" && (profile as any).subscription_status === "pro";
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.review_rating, 0) / reviews.length
      : profile.average_rating ?? 0;
  const reviewCount = reviews.length > 0 ? reviews.length : profile.total_reviews ?? 0;
  const experience = formatExperience(profile.experience_count);

  const groupedByCountry = Array.from(
    services.reduce((map, service) => {
      const key = `${service.country_id}:${service.country_name ?? "Country"}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(service);
      return map;
    }, new Map<string, ConsultantService[]>())
  );

  const countryGroups = groupedByCountry.map(([key, countryServices]) => {
    const country = countryServices[0];
    return {
      key,
      countryName: country.country_name ?? "Country",
      countryImage: getMediaUrl(country.country_image) ?? null,
      services: countryServices.map((service) => ({
        id: service.id,
        label: getServiceLabel(service),
        price: service.price,
        duration: service.duration,
        description: service.description,
      })),
      studyLevels: uniqueStrings(countryServices.flatMap((service) => service.study_level_names ?? [])),
      subjects: uniqueStrings(
        countryServices.flatMap((service) => [
          ...(service.subject_names ?? []),
          ...(service.subject_names_input ?? []),
        ])
      ),
      consultantInfo:
        uniqueStrings(countryServices.map((service) => service.description)).join(" ") ||
        profile.experience_summary ||
        "This consultant has not added a detailed profile summary yet.",
    };
  });

  return (
    <section className="legacy-consultant-profile-page">
      <div className="legacy-shell-container">
        <div className="legacy-consultant-profile-page__intro">
          <div>
            <p className="legacy-consultant-profile-page__crumb">Consultants / Profile Details</p>
            <h1>{name}</h1>
            <p>Country-wise study abroad consulting, admissions support, and application guidance.</p>
          </div>
          <Link href="/consultants" className="legacy-consultant-profile-page__back">
            <i className="fa-solid fa-arrow-left" /> Back to Consultants
          </Link>
        </div>

        <ConsultantProfileShell
          consultantId={consultantId}
          name={name}
          image={image}
          isPro={isPro}
          isVerified={isVerified}
          avgRating={avgRating}
          reviewCount={reviewCount}
          experience={experience}
          countryGroups={countryGroups}
          reviews={reviews}
          bio={profile.experience_summary}
          countryName={profile.country?.name}
        />
      </div>
    </section>
  );
}
