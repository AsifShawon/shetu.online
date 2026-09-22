import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMediaUrl } from "@/lib/api/client";
import { SERVER_API_BASE_URL } from "@/lib/api/server";

interface Training {
  id: number;
  title: string;
  thumbnail: string | null;
  training_type: string;
  description: string;
  overview: string;
  organization: string;
  address: string;
  language: string;
  application_deadline: string | null;
  start_date: string | null;
  duration: string;
  price: string;
  status: string;
}

async function getTraining(id: number): Promise<Training | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/api/consultants/trainings/${id}/`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CourseDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getTraining(Number(id));
  if (!course) notFound();

  return (
    <section className="py-16 md:py-20">
      <div className="legacy-container grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="legacy-panel overflow-hidden p-0">
          <img
            src={getMediaUrl(course.thumbnail) ?? "/legacy/Frontend/assets/img/page/training_banner.png"}
            alt={course.title}
            className="h-[380px] w-full object-cover"
          />
          <div className="p-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--legacy-secondary)]">
              {course.training_type}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-[var(--legacy-primary)]">{course.title}</h1>
            <p className="mt-6 text-base leading-8 text-[var(--legacy-muted)]">{course.description}</p>
            {course.overview && (
              <div className="mt-6">
                <h3 className="text-xl font-extrabold text-[var(--legacy-primary)]">Course Overview</h3>
                <p className="mt-3 text-base leading-8 text-[var(--legacy-muted)]">{course.overview}</p>
              </div>
            )}
          </div>
        </div>
        <div className="legacy-panel p-8">
          <h2 className="text-3xl font-extrabold text-[var(--legacy-primary)]">Enrollment Details</h2>
          <div className="mt-6 space-y-4 text-[15px] text-[var(--legacy-muted)]">
            <p>
              <strong className="text-slate-900">Organization:</strong> {course.organization}
            </p>
            {course.address && (
              <p>
                <strong className="text-slate-900">Address:</strong> {course.address}
              </p>
            )}
            <p>
              <strong className="text-slate-900">Language:</strong> {course.language || "English"}
            </p>
            <p>
              <strong className="text-slate-900">Duration:</strong> {course.duration}
            </p>
            {course.start_date && (
              <p>
                <strong className="text-slate-900">Start Date:</strong> {course.start_date}
              </p>
            )}
            {course.application_deadline && (
              <p>
                <strong className="text-slate-900">Application Deadline:</strong> {course.application_deadline}
              </p>
            )}
            <p className="text-xl font-extrabold text-[var(--legacy-primary)]">
              Price: BDT {course.price}
            </p>
          </div>
          <Link href={`/course/checkout/${course.id}` as Route} className="legacy-primary-btn mt-8">
            Go to Checkout
          </Link>
        </div>
      </div>
    </section>
  );
}
