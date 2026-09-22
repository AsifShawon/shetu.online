import type { Route } from "next";
import Link from "next/link";

import type { LegacyCourse } from "@/lib/legacy-data";

export function CourseCard({ course }: { course: LegacyCourse }) {
  const detailsHref = `/course/details/${course.id}` as Route;
  const checkoutHref = `/course/checkout/${course.id}` as Route;

  return (
    <div className="legacy-panel overflow-hidden p-0">
      <img src={course.image} alt={course.title} className="h-56 w-full object-cover" />
      <div className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--legacy-primary)]">{course.type}</p>
        <h3 className="mt-3 text-2xl font-extrabold leading-snug">{course.title}</h3>
        <p className="mt-3 text-[15px] leading-7 text-[var(--legacy-muted)]">{course.summary}</p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--legacy-muted)]">{course.organization}</p>
            <p className="text-lg font-extrabold text-[var(--legacy-primary)]">{course.price}</p>
          </div>
          <div className="flex gap-3">
            <Link href={detailsHref} className="legacy-outline-btn px-4 py-3">
              Details
            </Link>
            <Link href={checkoutHref} className="legacy-primary-btn px-4 py-3">
              Enroll
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
