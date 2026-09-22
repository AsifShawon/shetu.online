"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, UploadCloud, X, Calendar, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────
// 1. Duration Calculation Utility
// ────────────────────────────────────────────────────────────────────────

export function calculateEducationDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
  if (endDate < startDate) return "Invalid range: End date is before Start date";

  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }

  if (parts.length === 0) {
    return "Less than a month";
  }
  return parts.join(" ");
}

// Click outside hook supporting mouse and touch events
function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, callback]);
}

// Highlight matching search query text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="font-extrabold text-sky-700 bg-sky-50 px-0.5 rounded">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 2. Generic Combobox Component
// ────────────────────────────────────────────────────────────────────────

interface ComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  suggestions: string[];
  required?: boolean;
  disabled?: boolean;
  helper?: string;
  error?: string;
  onChange: (value: string) => void;
}

export function Combobox({
  label,
  placeholder,
  value,
  suggestions,
  required = false,
  disabled = false,
  helper,
  error,
  onChange,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useMemo(() => `combobox-listbox-${Math.random().toString(36).substring(2, 9)}`, []);

  useClickOutside(containerRef, () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  });

  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 8);
    const query = value.toLowerCase().trim();
    return suggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, suggestions]);

  // Sync scroll of active item in suggestion list
  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === "Enter") {
      if (isOpen) {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          onChange(filtered[focusedIndex]);
        }
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>

      <div className="relative">
        <input
          type="text"
          className={cn(
            "h-11 w-full rounded-2xl border bg-slate-50/50 px-4 pr-10 text-sm font-semibold text-slate-700 transition-all outline-none",
            "border-slate-200 hover:border-slate-300 focus:border-primary/80 focus:bg-white focus:ring-4 focus:ring-primary/5",
            error && "border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/5",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setFocusedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="h-4 w-4 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[999] top-[105%] left-0 w-full rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"
          >
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-60 overflow-y-auto thin-scrollbar flex flex-col gap-0.5"
            >
              {filtered.map((item, index) => {
                const isSelected = item === value;
                const isFocused = index === focusedIndex;
                return (
                  <li
                    key={item}
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm cursor-pointer transition-colors font-medium",
                      isFocused ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                    )}
                  >
                    <HighlightMatch text={item} query={value} />
                    {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                  </li>
                );
              })}

              {value.trim() && !filtered.includes(value) && (
                <li
                  role="option"
                  onClick={() => handleSelect(value)}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm cursor-pointer transition-colors text-sky-700 bg-sky-50/50 hover:bg-sky-50 font-semibold"
                >
                  <span>Use custom value: "{value}"</span>
                  <Check className="h-4 w-4 opacity-0" />
                </li>
              )}

              {filtered.length === 0 && !value.trim() && (
                <div className="py-6 text-center text-xs font-semibold text-slate-400">
                  No suggestions available
                </div>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <span className="text-xs font-semibold text-rose-500 ml-1 flex items-center gap-1 mt-0.5">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      ) : helper ? (
        <span className="text-xs font-medium text-slate-400 ml-1 mt-0.5">{helper}</span>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 3. Specialized Comboboxes
// ────────────────────────────────────────────────────────────────────────

const STUDY_SUGGESTIONS = [
  "SSC",
  "HSC",
  "O Level",
  "A Level",
  "Diploma",
  "Foundation",
  "Bachelor of Science",
  "Bachelor of Arts",
  "Bachelor of Business Administration",
  "Bachelor of Engineering",
  "Bachelor of Computer Science",
  "Bachelor of Information Technology",
  "Bachelor of Commerce",
  "Bachelor of Pharmacy",
  "Bachelor of Laws",
  "MBBS",
  "Master of Science",
  "Master of Arts",
  "Master of Business Administration",
  "Master of Engineering",
  "Master of Information Technology",
  "Postgraduate Diploma",
  "PhD / Doctor of Philosophy",
];

export function EducationTitleCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={STUDY_SUGGESTIONS}
    />
  );
}

const DEPT_SUGGESTIONS = [
  "Science",
  "Business Studies",
  "Humanities",
  "Computer Science",
  "Computer Science and Engineering",
  "Information Technology",
  "Software Engineering",
  "Electrical and Electronic Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Pharmacy",
  "Law",
  "Economics",
  "English",
  "Accounting",
  "Finance",
  "Marketing",
  "Management",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Public Health",
  "Nursing",
  "Architecture",
  "Data Science",
  "Cyber Security",
  "Artificial Intelligence",
];

export function DepartmentCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={DEPT_SUGGESTIONS}
    />
  );
}

const INST_SUGGESTIONS = [
  "University of Dhaka",
  "Bangladesh University of Engineering and Technology",
  "North South University",
  "BRAC University",
  "Independent University, Bangladesh",
  "East West University",
  "Daffodil International University",
  "National University",
  "Dhaka College",
  "Notre Dame College",
  "Rajuk Uttara Model College",
  "Government Titumir College",
  "Eden Mohila College",
  "University of Adelaide",
  "University of South Australia",
  "Flinders University",
  "Monash University",
  "University of Melbourne",
  "University of Sydney",
  "University of Toronto",
  "University of Manchester",
  "University of Hertfordshire",
];

export function InstitutionCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={INST_SUGGESTIONS}
    />
  );
}

const YEAR_SUGGESTIONS = Array.from({ length: 41 }, (_, i) => String(new Date().getFullYear() + 5 - i));

export function PassingYearCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={YEAR_SUGGESTIONS}
    />
  );
}

const GRADING_SUGGESTIONS = [
  "CGPA (out of 4.00)",
  "CGPA (out of 5.00)",
  "GPA (out of 5.00)",
  "First Class",
  "Second Class",
  "First Division",
  "Second Division",
  "Percentage (%)",
  "Pass",
  "Merit",
  "Distinction",
];

export function GradingSystemCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={GRADING_SUGGESTIONS}
    />
  );
}

const DURATION_SUGGESTIONS = [
  "4 years",
  "3 years",
  "2 years",
  "1 year",
  "5 years",
  "1.5 years",
  "2.5 years",
  "6 months",
  "3 months",
];

export function DurationCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={DURATION_SUGGESTIONS}
    />
  );
}

const ORG_SUGGESTIONS = [
  "Coursera",
  "Udemy",
  "edX",
  "LinkedIn Learning",
  "Google Academy",
  "Microsoft Learn",
  "Shetu Academy",
  "British Council",
  "IDP Education",
  "University of Dhaka",
  "BUET",
];

export function OrganizationCombobox(props: Omit<ComboboxProps, "suggestions">) {
  return (
    <Combobox
      {...props}
      suggestions={ORG_SUGGESTIONS}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────
// 4. Study Level Select
// ────────────────────────────────────────────────────────────────────────

interface StudyLevelSelectProps {
  value: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export function StudyLevelSelect({ value, required = false, disabled = false, error, onChange }: StudyLevelSelectProps) {
  const levels = ["SSC", "HSC", "O Level", "A Level", "Diploma", "Bachelor", "Master", "PhD", "Other"];
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
        Level of Education {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        className={cn(
          "h-11 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm font-semibold text-slate-700 transition-all outline-none",
          "border-slate-200 hover:border-slate-300 focus:border-primary/80 focus:bg-white focus:ring-4 focus:ring-primary/5",
          error && "border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/5",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Level</option>
        {levels.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs font-semibold text-rose-500 ml-1 flex items-center gap-1 mt-0.5">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 5. Result Input with Suggestion Chips
// ────────────────────────────────────────────────────────────────────────

interface ResultInputProps {
  value: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export function ResultInput({ value, required = false, disabled = false, error, onChange }: ResultInputProps) {
  const chips = ["GPA 5.00", "CGPA 3.75/4.00", "First Class", "Second Class", "Pass", "85%"];
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
        Result / Grade {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        className={cn(
          "h-11 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm font-semibold text-slate-700 transition-all outline-none",
          "border-slate-200 hover:border-slate-300 focus:border-primary/80 focus:bg-white focus:ring-4 focus:ring-primary/5",
          error && "border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/5",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        placeholder="e.g. CGPA 3.75/4.00 or GPA 5.00"
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
      {!disabled && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChange(chip)}
              className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-full transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      {error && (
        <span className="text-xs font-semibold text-rose-500 ml-1 flex items-center gap-1 mt-0.5">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 6. Session Date Range & Duration display
// ────────────────────────────────────────────────────────────────────────

interface SessionDateRangeProps {
  start: string;
  end: string;
  error?: string;
  disabled?: boolean;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
}

export function SessionDateRange({
  start,
  end,
  error,
  disabled = false,
  onChangeStart,
  onChangeEnd,
}: SessionDateRangeProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
            Session Start
          </label>
          <div className="relative">
            <input
              type="date"
              className={cn(
                "h-11 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm font-semibold text-slate-700 transition-all outline-none",
                "border-slate-200 hover:border-slate-300 focus:border-primary/80 focus:bg-white focus:ring-4 focus:ring-primary/5",
                disabled && "opacity-60 cursor-not-allowed"
              )}
              value={start}
              disabled={disabled}
              onChange={(e) => onChangeStart(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
            Session End
          </label>
          <div className="relative">
            <input
              type="date"
              className={cn(
                "h-11 w-full rounded-2xl border bg-slate-50/50 px-4 text-sm font-semibold text-slate-700 transition-all outline-none",
                "border-slate-200 hover:border-slate-300 focus:border-primary/80 focus:bg-white focus:ring-4 focus:ring-primary/5",
                disabled && "opacity-60 cursor-not-allowed"
              )}
              value={end}
              disabled={disabled}
              onChange={(e) => onChangeEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <span className="text-xs font-semibold text-rose-500 ml-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 7. Auto Duration Display
// ────────────────────────────────────────────────────────────────────────

interface AutoDurationDisplayProps {
  start: string;
  end: string;
}

export function AutoDurationDisplay({ start, end }: AutoDurationDisplayProps) {
  const duration = useMemo(() => calculateEducationDuration(start, end), [start, end]);

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3.5 mt-1">
      <div className="flex items-center gap-2.5 text-slate-600">
        <Calendar className="h-4.5 w-4.5 text-sky-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duration:</span>
        <span className="text-sm font-black text-slate-700">
          {start && end ? duration : "Will appear after selecting start and end dates."}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 8. Upload Dropzone Component
// ────────────────────────────────────────────────────────────────────────

interface EducationUploadDropzoneProps {
  label: string;
  selectedFileName: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

export function EducationUploadDropzone({
  label,
  selectedFileName,
  disabled = false,
  onChange,
}: EducationUploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
        {label}
      </label>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-[22px] px-6 py-8 text-center transition-all bg-slate-50/30 border-slate-200 cursor-pointer hover:border-slate-300 hover:bg-slate-50/50",
          isDragActive && "border-sky-500 bg-sky-50/20 scale-[0.99]",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          disabled={disabled}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
        />

        {selectedFileName && selectedFileName !== "No file selected" && selectedFileName !== "Current file attached" ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 line-clamp-1 max-w-[280px]">
                {selectedFileName}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="mt-2 text-xs font-bold text-rose-500 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <X className="h-3 w-3" /> Remove File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-500">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-700">
                Upload certificate or transcript
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Drag and drop here, or browse (PDF, JPG, PNG accepted)
              </p>
            </div>
            {selectedFileName && (
              <p className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {selectedFileName}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 9. Premium Form Card & Grid Layout Components
// ────────────────────────────────────────────────────────────────────────

interface CardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function EducationFormSectionCard({ title, description, icon, children, className }: CardProps) {
  return (
    <div className={cn("rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.02)] transition-all", className)}>
      <div className="mb-6 flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          {description && <p className="mt-1 text-xs font-semibold text-slate-500 leading-normal">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function EducationFormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className={cn(
        "grid gap-5 w-full",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}
