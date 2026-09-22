"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { API_BASE_URL } from "@/lib/api/client";

interface Post {
  id: number;
  student_name?: string;
  title: string;
  description: string;
  country_name?: string;
  service_name?: string;
  study_level_name?: string;
  subject: string;
  budget: string;
  status: string;
  created_at?: string;
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  return "Today";
}

function PostCard({ post }: { post: Post }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 450;
  const long = post.description.length > LIMIT;

  return (
    <div className="post-card-lp">
      {/* Header: avatar + name + time */}
      <div className="post-header-lp">
        <div className="post-user-lp">
          <img
            className="post-avatar-lp"
            src="/legacy/no-profile-img.png"
            alt={post.student_name ?? "Student"}
          />
          <div>
            <p className="post-username-lp">{post.student_name ?? "Student"}</p>
            <p className="post-time-lp">{relativeTime(post.created_at)}</p>
          </div>
        </div>
        <button type="button" className="post-ellipsis-lp" aria-label="More options">
          <i className="fas fa-ellipsis-h" />
        </button>
      </div>

      {/* Title */}
      <h4 className="post-title-lp">
        {post.title.length > 100 ? post.title.slice(0, 100) + "…" : post.title}
      </h4>

      {/* Description with toggle */}
      <p className="post-desc-lp">
        {expanded ? post.description : long ? post.description.slice(0, LIMIT) + "…" : post.description}
      </p>
      {long && (
        <button
          type="button"
          className="post-see-more-lp"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t("post_see_less") : t("post_see_more")}
        </button>
      )}

      {/* Tags */}
      <div className="post-tags-lp">
        {post.country_name && <span className="post-tag-lp">{post.country_name}</span>}
        {post.subject && <span className="post-tag-lp">{post.subject}</span>}
        {post.study_level_name && <span className="post-tag-lp">{post.study_level_name}</span>}
      </div>

      {/* Footer */}
      <div className="post-footer-lp">
        <button type="button" className="post-share-lp">
          <i className="fas fa-share" /> {t("post_share_btn")}
        </button>
        <Link href="/consultants" className="post-quotation-lp">
          {t("post_quotation_btn")} <i className="fa-solid fa-arrow-right" />
        </Link>
      </div>
    </div>
  );
}

export default function StudentPostsPage() {
  const { t } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/marketplace/posts/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Post[]) => {
        setPosts(data.filter((p) => p.status === "active" || p.status === "pending"));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Page banner */}
      <div
        className="legacy-page-banner"
        style={{
          backgroundImage: "url(/legacy/Frontend/assets/img/gallery/quatiotion.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "4rem 1rem",
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(30,50,100,0.65)" }} />
        <div className="legacy-container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: 800 }}>{t("post_page_title")}</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: "0.5rem" }}>
            {t("post_page_sub")}
          </p>
        </div>
      </div>

      <section className="post-feed-section">
        <div className="legacy-container" style={{ maxWidth: 860, margin: "0 auto", padding: "0 1rem" }}>
          {loading && (
            <p style={{ textAlign: "center", color: "var(--legacy-muted)", padding: "3rem 0" }}>
              {t("post_loading")}
            </p>
          )}
          {!loading && posts.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--legacy-muted)", padding: "3rem 0" }}>
              {t("post_no_posts")}
            </p>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!loading && posts.length > 0 && (
            <div className="post-view-all-lp">
              <Link href="/consultants" className="legacy-primary-btn">
                {t("post_view_consultants")} <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
