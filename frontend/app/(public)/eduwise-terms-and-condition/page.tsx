import { SERVER_API_BASE_URL } from "@/lib/api/server";

interface TermsDocument { id: number; title: string; content: string }

async function getTerms(): Promise<TermsDocument[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/api/content/terms/`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function TermsPage() {
  const docs = await getTerms();
  const doc = docs[0];

  return (
    <section className="py-16 md:py-20">
      <div className="legacy-container">
        <div className="legacy-panel mx-auto max-w-4xl p-8 md:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-[var(--legacy-secondary)]">
            Shetu Terms & Conditions
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-[var(--legacy-primary)]">
            {doc?.title ?? "Terms & Conditions"}
          </h1>
          {doc ? (
            <div
              className="mt-8 space-y-6 text-base leading-8 text-[var(--legacy-muted)] prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />
          ) : (
            <div className="mt-8 space-y-6 text-base leading-8 text-[var(--legacy-muted)]">
              <p>
                Shetu provides a platform for education-related information, consultant discovery, study-abroad enquiry,
                and course or package purchases. Platform access does not guarantee admission, visa success, or scholarship
                approval.
              </p>
              <p>
                Users are responsible for providing accurate academic, personal, and payment information. Consultants are
                responsible for keeping service details, pricing, and delivery expectations accurate.
              </p>
              <p>
                Payment, verification, account access, content moderation, and training enrollment remain subject to platform
                policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
