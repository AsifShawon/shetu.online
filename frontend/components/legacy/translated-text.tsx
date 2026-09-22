"use client";

import { useLang } from "@/components/layout/lang-provider";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Inline translated text — use inside server components to embed
 * client-side translated strings without converting the whole page.
 *
 * @example  <T k="section_faq_heading" />
 * @example  <h2><T k="section_explore_heading" /></h2>
 */
export function T({ k, className }: { k: TranslationKey; className?: string }) {
  const { t } = useLang();
  if (className) return <span className={className}>{t(k)}</span>;
  return <>{t(k)}</>;
}
