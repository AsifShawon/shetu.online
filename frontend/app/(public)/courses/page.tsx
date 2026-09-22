import type { Route } from "next";
import Link from "next/link";

import { T } from "@/components/legacy/translated-text";

import { getMediaUrl } from "@/lib/api/client";
import { SERVER_API_BASE_URL } from "@/lib/api/server";

interface Training {
  id: number;
  title: string;
  thumbnail: string | null;
  training_type: string;
  description: string;
  organization: string;
  language: string;
  start_date: string | null;
  application_deadline: string | null;
  duration: string;
  price: string;
  status: string;
}

const SERVICE_TABS = [
  "Assessment",
  "File Processing",
  "Visa Processing",
  "Feature Processing",
  "SOP Writing",
  "Scholarships Search"
];

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

async function getTrainings(): Promise<Training[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/api/consultants/trainings/`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CoursesPage({
  searchParams
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.service ?? "";

  const trainings = await getTrainings();
  const active = trainings.filter((t) => t.status === "active");

  return (
    <div>
      {/* Page banner */}
      <div
        className="legacy-page-banner"
        style={{
          backgroundImage: "url(/legacy/Frontend/assets/img/page/training_banner.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "4rem 1rem",
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(30,50,100,0.65)" }} />
        <div
          className="legacy-container"
          style={{ position: "relative", zIndex: 1, textAlign: "center" }}
        >
          <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: 800 }}>
            <T k="courses_banner_heading" />
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: "0.5rem" }}>
            <T k="courses_banner_sub" />
          </p>
        </div>
      </div>

      <section style={{ padding: "3rem 0 4rem", background: "#f5f8fc" }}>
        <div className="legacy-container">
          {/* Service filter tabs */}
          <div className="courses-tabs">
            <Link
              href={"/courses" as Route}
              className={!activeTab ? "active" : ""}
            >
              All
            </Link>
            {SERVICE_TABS.map((tab) => (
              <Link
                key={tab}
                href={`/courses?service=${encodeURIComponent(tab)}` as Route}
                className={activeTab === tab ? "active" : ""}
              >
                {tab}
              </Link>
            ))}
          </div>

          {/* Heading */}
          <h3
            style={{
              fontWeight: 800,
              fontSize: "1.4rem",
              color: "var(--legacy-primary)",
              marginBottom: "0.25rem"
            }}
          >
            <T k="courses_popular_heading" />
          </h3>
          <p style={{ color: "var(--legacy-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            <T k="courses_popular_sub" />
          </p>

          {/* Course cards */}
          {active.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--legacy-muted)", padding: "2rem 0" }}>
              No courses available yet.
            </p>
          ) : (
            active.map((course) => (
              <div key={course.id} className="program-card-lp">
                {/* Thumbnail */}
                <div className="pc-thumb">
                    <img
                      src={
                        course.thumbnail
                        ? getMediaUrl(course.thumbnail) ?? "/legacy/Frontend/assets/img/page/training_banner.png"
                        : "/legacy/Frontend/assets/img/page/training_banner.png"
                    }
                    alt={course.title}
                  />
                </div>

                {/* Details */}
                <div className="pc-details">
                  <h5 title={course.title}>
                    {course.title.length > 80 ? course.title.slice(0, 80) + "…" : course.title}
                  </h5>
                  {/* Stars */}
                  <div className="pc-stars">
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star-half-stroke" />
                    <i className="fa-regular fa-star empty" />
                  </div>
                  <div className="pc-info">
                    <p>
                      <i className="fa-solid fa-house" />
                      {course.organization || "Shetu"}
                    </p>
                    <p>
                      <i className="fa-solid fa-globe" /> {course.language || "Bengali"}
                      &nbsp;&nbsp;
                      <i className="fa-solid fa-calendar-days" /> {fmtDate(course.start_date)}
                    </p>
                    <p>
                      <i className="fa-solid fa-user" /> 500+ Users
                      &nbsp;&nbsp;
                      <i className="fa-regular fa-circle-play" /> 45+ Classes
                    </p>
                  </div>
                </div>

                {/* Apply section */}
                <div className="pc-apply">
                  <div>
                    {course.application_deadline && (
                      <p className="pc-deadline">
                        Apply by: {fmtDate(course.application_deadline)}
                      </p>
                    )}
                    <p className="pc-duration">
                      <i className="fa-regular fa-clock" /> {course.duration}
                    </p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--legacy-primary)", marginBottom: "0.5rem" }}>
                      BDT {course.price}
                    </p>
                  </div>
                  <div className="pc-btns">
                    <Link href={`/course/details/${course.id}` as Route}><T k="course_more_details" /></Link>
                    <Link href={`/course/details/${course.id}` as Route} className="apply-btn-lp">
                      <T k="courses_join" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* View all button */}
          {active.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
              <Link href={"/courses" as Route} className="legacy-primary-btn">
                <T k="courses_view_all" /> <i className="fa-solid fa-up-right-from-square" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
