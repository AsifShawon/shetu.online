"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { normalizeKey, normalizeText } from "@/lib/suggestions";

type BaseProps = {
  label: string;
  placeholder: string;
  required?: boolean;
  helper?: string;
  disabled?: boolean;
  maxSuggestions?: number;
};

type SuggestionInputProps = BaseProps & {
  value: string;
  suggestions: string[];
  allowCustom?: boolean;
  onChange: (value: string) => void;
};

type MultiSuggestionInputProps = BaseProps & {
  values: string[];
  suggestions: string[];
  allowCustom?: boolean;
  onChange: (values: string[]) => void;
};

export function SuggestionInput({
  label,
  placeholder,
  value,
  suggestions,
  required = false,
  helper,
  disabled = false,
  maxSuggestions = 8,
  allowCustom = true,
  onChange,
}: SuggestionInputProps) {
  const [open, setOpen] = useState(false);
  const deferredValue = useDeferredValue(value);
  const normalizedQuery = normalizeKey(deferredValue);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((item) => normalizeKey(item).includes(normalizedQuery)).slice(0, maxSuggestions),
    [maxSuggestions, normalizedQuery, suggestions],
  );

  const hasExactMatch = useMemo(
    () => suggestions.some((item) => normalizeKey(item) === normalizedQuery),
    [normalizedQuery, suggestions],
  );

  const showCustomOption = allowCustom && normalizedQuery.length > 0 && !hasExactMatch;

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className="sd-suggest-field">
      <label className="sd-label">{label}</label>
      <div className="sd-suggest-input-wrap">
        <div className="sd-suggest-control">
          <input
            className="sd-field"
            required={required}
            disabled={disabled}
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              if (!open) return;

              event.preventDefault();

              if (filteredSuggestions.length > 0) {
                selectValue(filteredSuggestions[0]);
                return;
              }

              if (showCustomOption) {
                selectValue(normalizeText(value));
              }
            }}
          />
          <i className="fa-solid fa-magnifying-glass" />
        </div>

        {open && !disabled ? (
          <div className="sd-suggest-dropdown">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="sd-suggest-option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectValue(item);
                }}
              >
                {item}
              </button>
            ))}

            {showCustomOption ? (
              <button
                type="button"
                className="sd-suggest-option sd-suggest-option--custom"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectValue(normalizeText(value));
                }}
              >
                Use custom value: "{normalizeText(value)}"
              </button>
            ) : null}

            {filteredSuggestions.length === 0 && !showCustomOption ? (
              <div className="sd-suggest-empty">No matching suggestions</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {helper ? <p className="sd-form-helper">{helper}</p> : null}
    </div>
  );
}

export function MultiSuggestionInput({
  label,
  placeholder,
  values,
  suggestions,
  required = false,
  helper,
  disabled = false,
  maxSuggestions = 10,
  allowCustom = true,
  onChange,
}: MultiSuggestionInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeKey(deferredQuery);

  const selectedKeys = useMemo(() => new Set(values.map((item) => normalizeKey(item))), [values]);

  const filteredSuggestions = useMemo(
    () =>
      suggestions
        .filter((item) => !selectedKeys.has(normalizeKey(item)))
        .filter((item) => normalizeKey(item).includes(normalizedQuery))
        .slice(0, maxSuggestions),
    [maxSuggestions, normalizedQuery, selectedKeys, suggestions],
  );

  const hasExactMatch = useMemo(
    () => suggestions.some((item) => normalizeKey(item) === normalizedQuery),
    [normalizedQuery, suggestions],
  );

  const showCustomOption = allowCustom && normalizedQuery.length > 0 && !hasExactMatch && !selectedKeys.has(normalizedQuery);

  const addValue = (nextValue: string) => {
    const cleaned = normalizeText(nextValue);
    if (!cleaned) return;
    if (selectedKeys.has(normalizeKey(cleaned))) return;

    onChange([...values, cleaned]);
    setQuery("");
    setOpen(false);
  };

  const removeValue = (target: string) => {
    const targetKey = normalizeKey(target);
    onChange(values.filter((item) => normalizeKey(item) !== targetKey));
  };

  return (
    <div className="sd-suggest-field">
      <label className="sd-label">{label}</label>

      <div className="sd-suggest-input-wrap sd-suggest-input-wrap--multi">
        {values.length > 0 ? (
          <div className="sd-suggest-chip-row">
            {values.map((item) => (
              <span className="sd-suggest-chip" key={item}>
                {item}
                <button type="button" onClick={() => removeValue(item)} aria-label={`Remove ${item}`}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="sd-suggest-control">
          <input
            className="sd-field sd-suggest-input-inline"
            required={required && values.length === 0}
            disabled={disabled}
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if ((event.key === "Backspace" || event.key === "Delete") && !query.trim() && values.length > 0) {
                removeValue(values[values.length - 1]);
                return;
              }

              if (!["Enter", ",", "Tab"].includes(event.key)) return;
              if (!query.trim()) return;

              event.preventDefault();

              if (filteredSuggestions.length > 0) {
                addValue(filteredSuggestions[0]);
                return;
              }

              if (showCustomOption) {
                addValue(query);
              }
            }}
          />

          <i className="fa-solid fa-magnifying-glass" />
        </div>

        {open && !disabled ? (
          <div className="sd-suggest-dropdown">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="sd-suggest-option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addValue(item);
                }}
              >
                {item}
              </button>
            ))}

            {showCustomOption ? (
              <button
                type="button"
                className="sd-suggest-option sd-suggest-option--custom"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addValue(query);
                }}
              >
                Add custom value: "{normalizeText(query)}"
              </button>
            ) : null}

            {filteredSuggestions.length === 0 && !showCustomOption ? (
              <div className="sd-suggest-empty">No matching suggestions</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {helper ? <p className="sd-form-helper">{helper}</p> : null}
    </div>
  );
}
