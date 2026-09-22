"use client";

import { useState } from "react";

import { faqs as fallbackFaqs } from "@/lib/legacy-data";

interface FaqItem {
  id?: number;
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs?: FaqItem[] }) {
  const [open, setOpen] = useState(0);
  const items = faqs ?? fallbackFaqs;

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const active = open === index;
        return (
          <div key={item.question} className="legacy-panel overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(active ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-lg font-bold text-[var(--legacy-primary)]">{item.question}</span>
              <i className={`fa-solid ${active ? "fa-minus" : "fa-plus"} text-[var(--legacy-secondary)]`} />
            </button>
            {active ? <div className="px-5 pb-5 text-base text-[var(--legacy-muted)]">{item.answer}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
