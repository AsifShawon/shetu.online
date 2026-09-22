"use client";

import { Plus, Trash2 } from "lucide-react";

import type {
  AssessmentReportWorkspace,
  ReportContent,
  ReportFieldColumn,
  ReportFieldDefinition,
  ReportRow,
  ReportValue,
} from "@/lib/api/assessments";

interface AssessmentReportSectionsProps {
  modules: AssessmentReportWorkspace["module_definitions"];
  content: ReportContent;
  readOnly?: boolean;
  errors?: Record<string, string>;
  activeModuleKey?: string;
  onChange?: (moduleKey: string, fieldKey: string, value: ReportValue) => void;
}

function valueAt(content: ReportContent, moduleKey: string, fieldKey: string): ReportValue {
  return content[moduleKey]?.[fieldKey] ?? "";
}

function optionLabel(field: ReportFieldDefinition, value: ReportValue) {
  const match = field.options?.find((item) => item.value === value);
  return match?.label ?? String(value || "").replaceAll("_", " ");
}

function displayValue(field: ReportFieldDefinition, value: ReportValue) {
  if (Array.isArray(value)) return "";
  if (field.kind === "select") return optionLabel(field, value);
  return String(value || "");
}

function cellInputType(column: ReportFieldColumn) {
  if (column.kind === "date") return "date";
  if (column.kind === "url") return "url";
  if (column.kind === "score") return "number";
  return "text";
}

function ReadOnlyField({ field, value }: { field: ReportFieldDefinition; value: ReportValue }) {
  if (value === "" || value === null || (Array.isArray(value) && value.length === 0)) return null;

  if (field.kind === "repeater" && Array.isArray(value)) {
    const rows = value as ReportRow[];
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h5 className="text-sm font-black text-slate-900">{field.label}</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                {(field.columns || []).map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-100 align-top">
                  {(field.columns || []).map((column) => {
                    const cell = row[column.key];
                    return (
                      <td key={column.key} className="min-w-36 px-4 py-3 leading-6 text-slate-700">
                        {column.kind === "url" && cell ? (
                          <a className="font-semibold text-blue-700 underline" href={String(cell)} rel="noreferrer" target="_blank">
                            Official source
                          </a>
                        ) : String(cell || "—").replaceAll("_", " ")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (field.kind === "checklist" && Array.isArray(value)) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <h5 className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{field.label}</h5>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950">
          {(value as string[]).map((item) => <li key={item}>✓ {optionLabel(field, item)}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <h5 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{field.label}</h5>
      {field.kind === "url" ? (
        <a className="mt-2 block break-all text-sm font-semibold text-blue-700 underline" href={String(value)} rel="noreferrer" target="_blank">
          {String(value)}
        </a>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{displayValue(field, value)}</p>
      )}
    </div>
  );
}

export function AssessmentReportSections({
  modules,
  content,
  readOnly = false,
  errors = {},
  activeModuleKey,
  onChange,
}: AssessmentReportSectionsProps) {
  const visibleModules = activeModuleKey
    ? modules.filter((module) => module.key === activeModuleKey)
    : modules;

  return (
    <div className="space-y-6">
      {visibleModules.map((module, moduleIndex) => (
        <section
          id={`report-module-${module.key}`}
          key={module.key}
          className={readOnly ? "space-y-5" : "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"}
        >
          <div className={readOnly ? "border-b-2 border-slate-900 pb-4" : "border-b border-slate-100 bg-gradient-to-r from-slate-950 to-blue-950 px-6 py-5 text-white"}>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${readOnly ? "text-blue-700" : "text-cyan-300"}`}>
              Section {moduleIndex + 1}
            </p>
            <h3 className={`mt-1 text-xl font-black ${readOnly ? "text-slate-950" : "text-white"}`}>{module.title}</h3>
            {module.description ? <p className={`mt-2 text-sm leading-6 ${readOnly ? "text-slate-500" : "text-slate-300"}`}>{module.description}</p> : null}
          </div>

          <div className={readOnly ? "space-y-6" : "space-y-6 p-5 sm:p-6"}>
            {module.sections.map((section) => (
              <div key={section.key} className={readOnly ? "space-y-4" : "rounded-3xl border border-slate-100 bg-slate-50/70 p-5"}>
                <div>
                  <h4 className="text-base font-black text-slate-900">{section.title}</h4>
                  {section.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p> : null}
                </div>

                <div className={readOnly ? "grid gap-4 md:grid-cols-2" : "grid gap-5 md:grid-cols-2"}>
                  {section.fields.map((field) => {
                    const value = valueAt(content, module.key, field.key);
                    const path = `${module.key}.${field.key}`;
                    const error = errors[path];
                    if (readOnly) {
                      return (
                        <div key={field.key} className={field.kind === "repeater" || field.kind === "long_text" || field.kind === "textarea" ? "md:col-span-2" : ""}>
                          <ReadOnlyField field={field} value={value} />
                        </div>
                      );
                    }

                    if (field.kind === "repeater") {
                      const rows = Array.isArray(value) ? value as ReportRow[] : [];
                      return (
                        <div key={field.key} className="md:col-span-2">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <label className="text-sm font-black text-slate-800">
                                {field.label}{field.required ? <span className="ml-1 text-rose-500">*</span> : null}
                              </label>
                              {field.helper ? <p className="mt-1 text-xs text-slate-500">{field.helper}</p> : null}
                            </div>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white"
                              onClick={() => {
                                const emptyRow = {
                                  _row_id: crypto.randomUUID(),
                                  ...Object.fromEntries((field.columns || []).map((item) => [item.key, ""])),
                                } as ReportRow;
                                onChange?.(module.key, field.key, [...rows, emptyRow]);
                              }}
                            >
                              <Plus size={15} /> Add row
                            </button>
                          </div>
                          <div className="space-y-3">
                            {rows.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                No entries yet. Add a structured row to continue.
                              </div>
                            ) : rows.map((row, rowIndex) => (
                              <div key={String(row._row_id || `${field.key}-${rowIndex}`)} className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Entry {rowIndex + 1}</span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${field.label} entry ${rowIndex + 1}`}
                                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                                    onClick={() => onChange?.(module.key, field.key, rows.filter((_, index) => index !== rowIndex))}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  {(field.columns || []).map((column) => {
                                    const cellPath = `${path}.${rowIndex}.${column.key}`;
                                    const cellError = errors[cellPath];
                                    return (
                                      <label key={column.key} className={column.kind === "long_text" ? "md:col-span-2 xl:col-span-3" : ""}>
                                        <span className="mb-1.5 block text-xs font-bold text-slate-600">
                                          {column.label}{column.required ? <span className="ml-1 text-rose-500">*</span> : null}
                                        </span>
                                        {column.kind === "select" ? (
                                          <select
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                                            value={String(row[column.key] || "")}
                                            onChange={(event) => {
                                              const next = rows.map((item, index) => index === rowIndex ? { ...item, [column.key]: event.target.value } : item);
                                              onChange?.(module.key, field.key, next);
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="ready">Ready</option>
                                            <option value="complete">Complete</option>
                                            <option value="pending">Pending</option>
                                            <option value="missing">Missing</option>
                                            <option value="not_applicable">Not applicable</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                            <option value="student">Student</option>
                                            <option value="consultant">Consultant</option>
                                          </select>
                                        ) : (
                                          <input
                                            type={cellInputType(column)}
                                            min={column.kind === "score" ? 1 : undefined}
                                            max={column.kind === "score" ? 5 : undefined}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                                            value={String(row[column.key] ?? "")}
                                            onChange={(event) => {
                                              const next = rows.map((item, index) => index === rowIndex ? { ...item, [column.key]: event.target.value } : item);
                                              onChange?.(module.key, field.key, next);
                                            }}
                                          />
                                        )}
                                        {cellError ? <span className="mt-1 block text-xs font-semibold text-rose-600">{cellError}</span> : null}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
                        </div>
                      );
                    }

                    if (field.kind === "checklist") {
                      const selected = Array.isArray(value) ? value as string[] : [];
                      return (
                        <fieldset key={field.key} className="md:col-span-2">
                          <legend className="text-sm font-black text-slate-800">
                            {field.label}{field.required ? <span className="ml-1 text-rose-500">*</span> : null}
                          </legend>
                          <div className="mt-3 space-y-2">
                            {(field.options || []).map((item) => (
                              <label key={item.value} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <input
                                  className="mt-1 h-4 w-4"
                                  type="checkbox"
                                  checked={selected.includes(item.value)}
                                  onChange={(event) => onChange?.(
                                    module.key,
                                    field.key,
                                    event.target.checked ? [...selected, item.value] : selected.filter((valueItem) => valueItem !== item.value),
                                  )}
                                />
                                <span className="text-sm leading-6 text-slate-700">{item.label}</span>
                              </label>
                            ))}
                          </div>
                          {error ? <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p> : null}
                        </fieldset>
                      );
                    }

                    const isLong = field.kind === "textarea" || field.kind === "long_text";
                    return (
                      <label key={field.key} className={isLong ? "md:col-span-2" : ""}>
                        <span className="mb-2 block text-sm font-black text-slate-800">
                          {field.label}{field.required ? <span className="ml-1 text-rose-500">*</span> : null}
                        </span>
                        {field.kind === "select" ? (
                          <select
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            value={String(value || "")}
                            onChange={(event) => onChange?.(module.key, field.key, event.target.value)}
                          >
                            <option value="">Select an outcome</option>
                            {(field.options || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        ) : isLong ? (
                          <textarea
                            className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder={field.placeholder}
                            value={String(value || "")}
                            onChange={(event) => onChange?.(module.key, field.key, event.target.value)}
                          />
                        ) : (
                          <input
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder={field.placeholder}
                            type={field.kind === "date" ? "date" : field.kind === "url" ? "url" : field.kind === "score" ? "number" : "text"}
                            min={field.kind === "score" ? 1 : undefined}
                            max={field.kind === "score" ? 5 : undefined}
                            value={String(value || "")}
                            onChange={(event) => onChange?.(module.key, field.key, event.target.value)}
                          />
                        )}
                        {field.helper ? <span className="mt-2 block text-xs leading-5 text-slate-500">{field.helper}</span> : null}
                        {error ? <span className="mt-2 block text-xs font-semibold text-rose-600">{error}</span> : null}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
