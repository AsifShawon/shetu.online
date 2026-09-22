import type { ConsultantService } from "@/lib/api/consultants";
import type { FAQ, SiteSetting, Testimonial } from "@/lib/api/content";
import type {
  Country,
  EducationalInfo,
  ServiceCategory,
  Training,
  University,
} from "@/lib/api/catalog";
import { SERVER_API_BASE_URL } from "@/lib/api/server";
import type { StudentPost } from "@/lib/api/marketplace";
import { HomeLanding } from "@/components/sections/home-landing";

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return [] as unknown as T;
    }

    return response.json() as Promise<T>;
  } catch {
    return [] as unknown as T;
  }
}

export default async function HomePage() {
  const [
    faqs,
    testimonials,
    settings,
    categories,
    trainings,
    posts,
    educationalInfo,
    countries,
    consultantServices,
    universities,
  ] = await Promise.all([
    fetchJson<FAQ[]>("/api/content/faq/"),
    fetchJson<Testimonial[]>("/api/content/testimonials/"),
    fetchJson<SiteSetting[]>("/api/content/settings/"),
    fetchJson<ServiceCategory[]>("/api/catalog/services/"),
    fetchJson<Training[]>("/api/consultants/trainings/"),
    fetchJson<StudentPost[]>("/api/marketplace/posts/"),
    fetchJson<EducationalInfo[]>("/api/catalog/educational-info/"),
    fetchJson<Country[]>("/api/catalog/countries/"),
    fetchJson<ConsultantService[]>("/api/consultants/services/"),
    fetchJson<University[]>("/api/catalog/universities/"),
  ]);

  return (
    <HomeLanding
      categories={categories}
      consultantServices={consultantServices}
      countries={countries}
      educationalInfo={educationalInfo}
      faqs={faqs}
      posts={posts}
      site={settings[0] ?? null}
      testimonials={testimonials}
      trainings={trainings}
      universities={universities}
    />
  );
}
