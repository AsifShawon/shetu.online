import type { LegacyPost } from "@/lib/legacy-data";

export function StudentPostCard({ post }: { post: LegacyPost }) {
  return (
    <div className="legacy-panel p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{post.country}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {post.studyLevel}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-extrabold text-[var(--legacy-primary)]">{post.title}</h3>
      <p className="mt-3 text-[15px] leading-7 text-[var(--legacy-muted)]">{post.description}</p>
      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-bold">Subject</p>
          <p className="mt-1 text-[var(--legacy-muted)]">{post.subject}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-bold">Budget</p>
          <p className="mt-1 text-[var(--legacy-muted)]">{post.budget}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="font-bold">Country</p>
          <p className="mt-1 text-[var(--legacy-muted)]">{post.country}</p>
        </div>
      </div>
    </div>
  );
}
