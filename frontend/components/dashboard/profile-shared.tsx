"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------
// Modern Input Component
// ----------------------------------------------------
interface ModernProfileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: string;
}

export function ModernProfileInput({
  label,
  error,
  icon,
  className,
  readOnly,
  disabled,
  id,
  ...props
}: ModernProfileInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 tracking-wide select-none">
        {label}
      </label>
      <div className="relative w-full group">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors">
            <i className={icon} />
          </span>
        )}
        <input
          id={inputId}
          readOnly={readOnly}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5",
            icon && "pl-10",
            readOnly && "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-80 hover:border-slate-200",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 hover:border-slate-200",
            error && "border-red-300 focus:border-red-500 focus:ring-red-100/50 hover:border-red-400",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
}

// ----------------------------------------------------
// Modern Select Component
// ----------------------------------------------------
interface ModernProfileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  icon?: string;
  children: React.ReactNode;
}

export function ModernProfileSelect({
  label,
  error,
  icon,
  className,
  disabled,
  children,
  id,
  ...props
}: ModernProfileSelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 tracking-wide select-none">
        {label}
      </label>
      <div className="relative w-full group">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors">
            <i className={icon} />
          </span>
        )}
        <select
          id={selectId}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 transition-all hover:border-slate-300 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 appearance-none pr-10",
            icon && "pl-10",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 hover:border-slate-200",
            error && "border-red-300 focus:border-red-500 focus:ring-red-100/50 hover:border-red-400",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-slate-800">
          <i className="fa-solid fa-chevron-down text-xs" />
        </span>
      </div>
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
}

// ----------------------------------------------------
// Modern Textarea Component
// ----------------------------------------------------
interface ModernProfileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function ModernProfileTextarea({
  label,
  error,
  className,
  readOnly,
  disabled,
  id,
  ...props
}: ModernProfileTextareaProps) {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700 tracking-wide select-none">
        {label}
      </label>
      <textarea
        id={textareaId}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5 resize-y min-h-[96px]",
          readOnly && "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-80 hover:border-slate-200",
          disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 hover:border-slate-200",
          error && "border-red-300 focus:border-red-500 focus:ring-red-100/50 hover:border-red-400",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
}

// ----------------------------------------------------
// Combobox / Auto-suggestion Input
// ----------------------------------------------------
interface ProfileComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
}

export function ProfileCombobox({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  readOnly,
  disabled,
  error,
}: ProfileComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = suggestions.filter((s) =>
    (s || "").toLowerCase().includes((inputValue || "").toLowerCase())
  );

  const displaySuggestions = filtered.slice(0, 8);

  const handleSelect = (val: string) => {
    onChange(val);
    setInputValue(val);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
      <label className="text-xs font-semibold text-slate-700 tracking-wide select-none">{label}</label>
      <div className="relative w-full group">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!readOnly && !disabled) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-800/5",
            readOnly && "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-80 hover:border-slate-200",
            disabled && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 hover:border-slate-200",
            error && "border-red-300 focus:border-red-500 focus:ring-red-100/50 hover:border-red-400"
          )}
        />
        {!readOnly && !disabled && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-slate-800 transition-colors">
            <i className="fa-solid fa-chevron-down text-[10px]" />
          </span>
        )}
      </div>

      {isOpen && displaySuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[74px] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl transition-all">
          {displaySuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
}

// ----------------------------------------------------
// Tag/Chip Input for Cities, Universities, and Languages
// ----------------------------------------------------
interface TagItem {
  id: string | number;
  name: string;
}

interface ProfileTagInputProps {
  label: string;
  value: string[] | string;
  onChange: (value: any) => void;
  suggestions: TagItem[] | string[];
  placeholder?: string;
  disabled?: boolean;
}

export function ProfileTagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
}: ProfileTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  let currentTags: TagItem[] = [];
  const isStringValue = typeof value === "string";

  if (isStringValue) {
    const list = value.split(",").map((s) => s.trim()).filter(Boolean);
    currentTags = list.map((s) => ({ id: s, name: s }));
  } else {
    const ids = (value || []).map(String);
    currentTags = ids.map((id) => {
      const found = suggestions.find((s) =>
        typeof s === "string" ? s === id : String(s.id) === id
      );
      if (found) {
        return typeof found === "string" ? { id: found, name: found } : { id: String(found.id), name: found.name };
      }
      return { id, name: id };
    });
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemove = (idToRemove: string | number) => {
    if (disabled) return;
    if (isStringValue) {
      const nextList = currentTags.filter((t) => t.id !== idToRemove).map((t) => t.name);
      onChange(nextList.join(", "));
    } else {
      const nextList = currentTags.filter((t) => t.id !== idToRemove).map((t) => t.id);
      onChange(nextList);
    }
  };

  const handleSelect = (item: TagItem) => {
    if (disabled) return;
    if (currentTags.some((t) => t.id === item.id)) {
      setIsOpen(false);
      setInputValue("");
      return;
    }

    if (isStringValue) {
      const nextList = [...currentTags.map((t) => t.name), item.name];
      onChange(nextList.join(", "));
    } else {
      const nextList = [...currentTags.map((t) => t.id), item.id];
      onChange(nextList);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const val = inputValue.trim();
      handleSelect({ id: val, name: val });
    }
  };

  const filterQuery = inputValue.toLowerCase().trim();
  const normalizedSuggestions: TagItem[] = (suggestions || []).map((s) => {
    if (typeof s === "string") return { id: s, name: s };
    return { id: String(s.id), name: s.name };
  });

  const filtered = normalizedSuggestions.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery) &&
      !currentTags.some((t) => t.id === s.id)
  );

  const displaySuggestions = filtered.slice(0, 8);

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
      <label className="text-xs font-semibold text-slate-700 tracking-wide select-none">{label}</label>
      <div
        className={cn(
          "min-h-[44px] w-full p-2 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-1.5 transition-all hover:border-slate-300 focus-within:border-slate-800 focus-within:ring-4 focus-within:ring-slate-800/5",
          disabled && "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 hover:border-slate-200"
        )}
      >
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200/50"
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-[10px] ml-0.5"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={currentTags.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none h-7 px-1"
        />
      </div>

      {isOpen && (displaySuggestions.length > 0 || (inputValue.trim() && !currentTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase()))) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
          {displaySuggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
            >
              {item.name}
            </button>
          ))}
          {inputValue.trim() && !normalizedSuggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => handleSelect({ id: inputValue.trim(), name: inputValue.trim() })}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 border-t border-slate-50 hover:bg-slate-50 hover:text-slate-950 transition-colors"
            >
              Add custom: "{inputValue.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Modern Upload Card
// ----------------------------------------------------
interface ProfileUploadCardProps {
  label: string;
  accept?: string;
  fileName: string | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function ProfileUploadCard({
  label,
  accept,
  fileName,
  onFileSelect,
  disabled,
}: ProfileUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-xs font-semibold text-slate-700 tracking-wide select-none">{label}</span>
      <div
        onClick={() => {
          if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={cn(
          "w-full min-h-[96px] border-2 border-dashed border-slate-200 rounded-[16px] bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all flex flex-col items-center justify-center p-4 cursor-pointer relative shadow-sm",
          disabled && "bg-slate-50 border-slate-200 cursor-not-allowed opacity-85"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onFileSelect(file);
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center gap-1.5 select-none">
          <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-cloud-arrow-up text-sm" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              {fileName ? fileName : "Choose File"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {accept ? `Accepts ${accept}` : "PNG, JPG or WEBP"}
            </p>
          </div>
        </div>

        {fileName && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-3.5 w-6 h-6 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all shadow-sm"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Section Cards & Shell
// ----------------------------------------------------
export function ProfileEditShell({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-4 items-start w-full">{children}</div>;
}

export function ProfileHeaderCard({
  avatarUrl,
  name,
  email,
  role,
  completion,
  onAvatarChange,
  editMode,
  onToggleEdit,
}: {
  avatarUrl: string;
  name: string;
  email: string;
  role: string;
  completion?: number;
  onAvatarChange?: (file: File | null) => void;
  editMode: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="col-span-full border border-slate-100 bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative group select-none">
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm transition-transform group-hover:scale-[1.02]"
            />
            {editMode && onAvatarChange && (
              <label className="absolute inset-0 bg-slate-900/60 text-white rounded-xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <i className="fa-solid fa-camera text-xs" />
              </label>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-800 leading-tight">{name}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-slate-100/80 text-slate-600 uppercase border border-slate-200/40">
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{email}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Keep your profile updated so consultants can understand your background faster.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap md:flex-nowrap">
          {completion !== undefined && (
            <div className="flex flex-col gap-1.5 w-44">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <span>Profile Completion</span>
                <span>{completion}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/10">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleEdit}
            className={cn(
              "h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]",
              editMode ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white" : "bg-white text-slate-700 border-slate-200"
            )}
          >
            <i className={cn("fa-solid", editMode ? "fa-check" : "fa-pen-to-square")} />
            {editMode ? "Done Editing" : "Edit Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileSectionCard({
  title,
  icon,
  helperText,
  children,
  id,
}: {
  title: string;
  icon: string;
  helperText?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="border border-slate-100 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5 w-full transition-all"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm select-none">
          <i className={cn("text-xs", icon)} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {helperText && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{helperText}</p>}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ProfileSectionNav({
  items,
  activeSection,
  onSectionClick,
}: {
  items: { id: string; label: string; icon: string }[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  return (
    <>
      {/* Desktop Static Sidebar */}
      <div className="hidden lg:flex flex-col gap-1 border border-slate-100 bg-white rounded-2xl p-4 shadow-sm w-full">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionClick(item.id)}
            className={cn(
              "flex items-center gap-3 w-full h-10 px-4 rounded-xl text-left text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]",
              activeSection === item.id
                ? "bg-slate-900 text-white shadow-sm shadow-slate-900/10"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <i className={cn("text-xs w-4 text-center transition-transform group-hover:scale-110", item.icon)} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="col-span-full lg:hidden border-b border-slate-100 bg-white/80 backdrop-blur sticky top-[60px] z-30 flex gap-1.5 p-2 overflow-x-auto scrollbar-none">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionClick(item.id)}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              activeSection === item.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 bg-slate-50 hover:bg-slate-100"
            )}
          >
            <i className={cn("text-[10px]", item.icon)} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ----------------------------------------------------
// Compact Action Bar
// ----------------------------------------------------
export function StickyProfileActionBar({
  onSave,
  onReset,
  saving,
  disabled,
  hasReset = false,
}: {
  onSave: (e: any) => void;
  onReset?: () => void;
  saving: boolean;
  disabled: boolean;
  hasReset?: boolean;
}) {
  return (
    <div className="w-full mt-4 flex items-center justify-end gap-3 p-1">
      {hasReset && onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || saving}
          className="h-10 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          Reset
        </button>
      )}
      <button
        type="submit"
        onClick={onSave}
        disabled={disabled || saving}
        className="h-11 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 shadow-sm"
      >
        {saving && <i className="fa-solid fa-spinner animate-spin" />}
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </div>
  );
}
