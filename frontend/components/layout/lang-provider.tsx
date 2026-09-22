"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

const STORAGE_KEY = "eduwise-language";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "bn",
  setLang: () => {},
  t: (key) => (translations.bn as Record<string, string>)[key] ?? key,
});

export function LangProvider({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "bn" || saved === "en") setLangState(saved);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: TranslationKey): string {
    return (translations[lang] as Record<string, string>)[key]
      ?? (translations.en as Record<string, string>)[key]
      ?? key;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
