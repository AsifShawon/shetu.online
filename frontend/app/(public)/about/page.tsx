"use client";

import { useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { API_BASE_URL } from "@/lib/api/client";

interface AboutSection {
  id: number;
  title: string;
  description: string;
  image: string | null;
}

async function getAbout(): Promise<AboutSection[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/content/about/`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default function AboutPage() {
  const { t } = useLang();
  const [sections, setSections] = useState<AboutSection[]>([]);

  useEffect(() => {
    getAbout().then(setSections).catch(() => setSections([]));
  }, []);

  // Use API section data if available, else fall back to translations
  const mainHeading = sections[0]?.title ?? t("about_desc_heading");
  const mainDesc = sections[0]?.description ?? t("about_desc_detail");

  const iconCards = [
    {
      icon: "fa-user-graduate",
      title: t("card_consultancy"),
      desc: t("card_consultancy_desc"),
    },
    {
      icon: "fa-graduation-cap",
      title: t("card_info"),
      desc: t("card_info_desc"),
    },
    {
      icon: "fa-screwdriver-wrench",
      title: t("card_training"),
      desc: t("card_training_desc"),
    },
  ];

  return (
    <section className="about_section">
      <div className="container">
        {/* Row 1: Logo + heading + subtitle */}
        <div className="section_title_all">
          <div className="logo">
            <img src="/shetu_logo.jpeg" alt={t("site_name")} className="mx-auto h-16 w-auto rounded-xl object-contain shadow-sm" />
          </div>
          <h3>{t("about_welcome")}</h3>
          <p className="section_subtitle mx-auto text-muted">
            {t("about_sub")}
          </p>
        </div>

        {/* Row 2: text left + image right */}
        <div className="row vertical_content_manage mt-5">
          <div className="col-lg-6">
            <div className="about_header_main mt-3">
              <h4 className="about_heading font-weight-bold">{mainHeading}</h4>
              <p className="text-muted mt-3">{mainDesc}</p>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="img_about mt-3">
              <img
                src="https://i.ibb.co/qpz1hvM/About-us.jpg"
                alt="About Shetu"
                className="img-fluid mx-auto d-block"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Three icon cards */}
        <div className="row mt-3">
          {iconCards.map((card) => (
            <div key={card.title} className="col-lg-4">
              <div className="about_content_box_all mt-3">
                <div className="about_detail">
                  <div className="about_icon">
                    <i className={`fa-solid ${card.icon}`} />
                  </div>
                  <h5 className="text-dark text-capitalize mt-3 font-weight-bold">{card.title}</h5>
                  <p className="edu_desc mb-0 mt-3 text-muted">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
