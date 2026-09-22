export function formatDurationDays(value?: string | number | null) {
  const raw = typeof value === "number" ? String(value) : (value ?? "").trim();

  if (!raw) {
    return "Duration on request";
  }

  if (/^\d+(?:\.0+)?$/.test(raw)) {
    const days = Number.parseFloat(raw);
    const rounded = Number.isFinite(days) ? Math.round(days) : 0;
    if (rounded <= 0) {
      return "Duration on request";
    }

    return `${rounded} day${rounded === 1 ? "" : "s"}`;
  }

  return raw;
}
