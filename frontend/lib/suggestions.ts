export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildSuggestionList(
  values: Array<string | null | undefined>,
  options?: { sort?: boolean },
) {
  const sort = options?.sort ?? true;

  const items = Array.from(
    new Set(
      values
        .map((value) => normalizeText(value ?? ""))
        .filter(Boolean),
    ),
  );

  return sort ? items.sort((left, right) => left.localeCompare(right)) : items;
}

export function normalizeKey(value: string) {
  return normalizeText(value).toLowerCase();
}
