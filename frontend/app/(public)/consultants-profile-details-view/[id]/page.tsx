import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsultantProfileShell } from "@/components/legacy/consultant-profile-shell";
import { SERVER_API_BASE_URL } from "@/lib/api/server";
import type { ConsultantService } from "@/lib/api/consultants";

interface Review {
  id: number;
  consultant_id?: number;
  student_name?: string;
  review_message: string;
  review_rating: number;
  created_at?: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return [] as unknown as T;
    return res.json();
  } catch {
    return [] as unknown as T;
  }
}

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function formatExperience(value: string | null | undefined) {
  if (!value) return "0 yrs";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "0 yrs";
  const diffMs = Date.now() - parsed.getTime();
  const years = Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return "<1 yr";
  return `${Math.floor(years)} yrs`;
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

  const [allServices, reviews] = await Promise.all([
    fetchJson<ConsultantService[]>("/api/consultants/services/?scope=public"),
    fetchJson<Review[]>("/api/assessments/reviews/"),
  ]);

  const services = allServices.filter(
    (service) => service.consultant_id === consultantId && service.status === "active",
  );

  if (services.length === 0) {
    notFound();
  }

  const first = services[0];
  const name = first.consultant_name ?? "Shetu Consultant";
  const image = first.consultant_image ?? "/legacy/no-profile-img.png";
  const isVerified = first.consultant_verification_status === "accepted";
  const isPro = first.consultant_subscription_status === "pro";
  const consultantReviews = reviews.filter((review) => review.consultant_id === consultantId);
  const avgRating =
    consultantReviews.length > 0
      ? consultantReviews.reduce((sum, review) => sum + review.review_rating, 0) / consultantReviews.length
      : first.consultant_rating ?? 0;

  const experience = formatExperience(first.consultant_joined_at ?? null);
  const groupedByCountry = Array.from(
    services.reduce((map, service) => {
      const key = `${service.country_id}:${service.country_name ?? "Country"}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(service);
      return map;
    }, new Map<string, ConsultantService[]>()),
  );

  const countryGroups = groupedByCountry.map(([key, countryServices]) => {
    const country = countryServices[0];
    return {
      key,
      countryName: country.country_name ?? "Country",
      countryImage: country.country_image ?? null,
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
        ]),
      ),
      consultantInfo:
        uniqueStrings(countryServices.map((service) => service.description)).join(" ") ||
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
          name={name}
          image={image}
          isPro={isPro}
          isVerified={isVerified}
          avgRating={avgRating}
          reviewCount={consultantReviews.length}
          experience={experience}
          countryGroups={countryGroups}
          reviews={consultantReviews}
        />
      </div>
    </section>
  );
}
