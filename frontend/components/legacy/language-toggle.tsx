"use client";

import { useEffect, useRef, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";

const options = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" }
] as const;

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const active = options.find((option) => option.value === lang) ?? options[0];

  return (
    <div ref={rootRef} className="legacy-lang-dropdown">
      <button
        type="button"
        className="legacy-lang-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <i className="fa-solid fa-globe" />
        <span>{active.label}</span>
        <i className={`fa-solid fa-chevron-down legacy-lang-trigger-caret ${open ? "is-open" : ""}`} />
      </button>

      <div className={`legacy-lang-menu ${open ? "is-open" : ""}`} role="menu" aria-label="Language options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={lang === option.value}
            className={`legacy-lang-menu-item ${lang === option.value ? "is-active" : ""}`}
            onClick={() => {
              setLang(option.value);
              setOpen(false);
            }}
          >
            <span>{option.label}</span>
            {lang === option.value ? <i className="fa-solid fa-check" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
