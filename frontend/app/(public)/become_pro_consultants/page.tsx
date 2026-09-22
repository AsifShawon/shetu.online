import { SERVER_API_BASE_URL } from "@/lib/api/server";
import { DEFAULT_PRO_PACKAGES } from "@/lib/default-pro-packages";

interface ProPackage {
  id: number;
  name: string;
  level: string;
  package_type: "monthly" | "annual";
  duration_days: number;
  description: string;
  price: string;
  features: string[];
  status: string;
}

async function getPackages(): Promise<ProPackage[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/api/consultants/pro-packages/`, {
      next: { revalidate: 120 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const TAG_MAP: Record<string, string> = { premium: "BEST", standard: "POPULAR", basic: "BASIC" };
const PLAN_MAP: Record<string, string> = { premium: "PREMIUM", standard: "STANDARD", basic: "STANDARD" };

export default async function ProConsultantsPage() {
  const packages = await getPackages();
  const active = packages.filter((p) => p.status === "active");
  const visiblePackages = active.length > 0 ? active : DEFAULT_PRO_PACKAGES;

  return (
    <section className="legacy-package-page">
      <div className="legacy-shell-container">
        <div className="legacy-package-banner">
          <img src="/legacy/Frontend/assets/img/page/pro_user.png" alt="" />
          <div>
            <h2 className="text-[2rem] font-extrabold text-[var(--legacy-primary)]">
              হয়ে উঠুন প্রো কনসালটেন্ট - উপভোগ করুন বাড়তি সুবিধা
            </h2>
            <p className="mt-2 max-w-4xl text-[17px] leading-8 text-[#6b7280]">
              সঠিক সাবস্ক্রিপশন বেছে নিয়ে প্রো কনসালটেন্ট হয়ে উঠুন এবং বিদেশে পড়াশোনা নিয়ে পরামর্শপ্রাপ্ত আগ্রহী
              শিক্ষার্থীদের কাছে আরও দৃশ্যমান ও বিশ্বাসযোগ্য হয়ে উঠুন।
            </p>
          </div>
        </div>

        <h1 className="legacy-package-heading">আপনার উপযুক্ত প্ল্যানটি বেছে নিন</h1>
        <p className="legacy-package-subheading">আপনার জন্য সবচেয়ে উপযোগী প্যাকেজটি নির্বাচন করুন</p>

        <div className="legacy-package-grid">
          {visiblePackages.map((pkg, index) => {
            const selected = index === visiblePackages.length - 1;
            const level = (pkg.level ?? "basic").toLowerCase();
            const tag = TAG_MAP[level] ?? pkg.level.toUpperCase();
            const plan = PLAN_MAP[level] ?? "PLAN";
            const features = Array.isArray(pkg.features)
              ? pkg.features
              : typeof pkg.features === "string"
              ? (pkg.features as string).split(",").map((f: string) => f.trim())
              : [pkg.description];

            return (
              <div key={pkg.id} className={`legacy-package-card ${selected ? "selected" : ""}`}>
                <span className="legacy-package-tag">{tag}</span>
                <span className="legacy-package-plan">{plan}</span>
                <h2 className="mt-6 text-[2rem] font-extrabold">
                  {pkg.package_type === "annual" ? "Annual Access" : "Monthly Access"}
                </h2>
                <p className={`mt-3 text-[15px] ${selected ? "text-white/70" : "text-[#6b7280]"}`}>
                  {pkg.description}
                </p>
                <div className="legacy-package-price">
                  ৳{pkg.price}{" "}
                  <span className={`text-[1.05rem] font-semibold ${selected ? "text-white/75" : "text-[#6b7280]"}`}>
                    /package
                  </span>
                </div>
                <a href="/login" className="legacy-package-button">
                  সাবস্ক্রাইব করুন
                </a>
                <div className="legacy-package-divider" />
                <h4 className="text-[1.5rem] font-extrabold">What&apos;s included:</h4>
                <div className="legacy-package-features">
                  {features.map((feature: string, featureIndex: number) => (
                    <div key={featureIndex} className="legacy-package-feature">
                      <span className="legacy-package-feature-icon">
                        <i className="fa-solid fa-check" />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[#6b7280]">
          All plans include a 14-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
}
