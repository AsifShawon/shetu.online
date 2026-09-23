"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  adminOptionSources,
  type AdminFieldConfig,
  type AdminResourceConfig,
  type AdminSectionConfig,
  type AdminSelectOption,
} from "@/lib/admin-config";
import { ApiError, getMediaUrl } from "@/lib/api/client";
import {
  createAdminResource,
  deleteAdminResource,
  getAdminResource,
  updateAdminResource,
  type AdminRecord,
} from "@/lib/api/admin";

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as Record<string, unknown>;
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    for (const value of Object.values(body)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }
  return "Request failed. Please try again.";
}

function resolveRecordValue(record: AdminRecord, key: string): unknown {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (value && typeof value === "object" && segment in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

function toDateInputValue(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  return value.slice(0, 10);
}

function toDateTimeInputValue(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  return value.replace("Z", "").slice(0, 16);
}

function getInitialFieldValue(record: AdminRecord | null | undefined, field: AdminFieldConfig): unknown {
  if (!record) {
    if (field.type === "checkbox") return false;
    if (field.type === "json") return "[]";
    if (field.type === "file") return null;
    return "";
  }

  let rawValue = record[field.name];

  if (rawValue === undefined && field.name.endsWith("_id")) {
    const relationValue = record[field.name.slice(0, -3)];
    if (relationValue && typeof relationValue === "object" && "id" in (relationValue as Record<string, unknown>)) {
      rawValue = (relationValue as Record<string, unknown>).id;
    }
  }

  if (field.type === "checkbox") return Boolean(rawValue);
  if (field.type === "json") return rawValue ? JSON.stringify(rawValue, null, 2) : "[]";
  if (field.type === "date") return toDateInputValue(rawValue);
  if (field.type === "datetime") return toDateTimeInputValue(rawValue);
  if (field.type === "file") return null;
  if (field.type === "select" && rawValue && typeof rawValue === "object" && "id" in (rawValue as Record<string, unknown>)) {
    return (rawValue as Record<string, unknown>).id ?? "";
  }

  return rawValue ?? "";
}

function buildInitialFormState(resource: AdminResourceConfig, record?: AdminRecord | null): Record<string, unknown> {
  return resource.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.name] = getInitialFieldValue(record, field);
    return acc;
  }, {});
}

function buildPayload(resource: AdminResourceConfig, formState: Record<string, unknown>): FormData | Record<string, unknown> {
  const hasFile = resource.fields.some((field) => field.type === "file" && formState[field.name] instanceof File);

  if (hasFile) {
    const payload = new FormData();
    resource.fields.forEach((field) => {
      const rawValue = formState[field.name];
      if (field.type === "file") {
        if (rawValue instanceof File) {
          payload.append(field.name, rawValue);
        }
        return;
      }

      let value: unknown = rawValue;
      if (field.type === "number") {
        value = rawValue === "" ? "" : Number(rawValue);
      } else if (field.type === "checkbox") {
        value = Boolean(rawValue);
      } else if (field.type === "json") {
        value = rawValue ? JSON.parse(String(rawValue)) : [];
      }

      if (value === undefined || value === null) {
        payload.append(field.name, "");
      } else if (typeof value === "object") {
        payload.append(field.name, JSON.stringify(value));
      } else {
        payload.append(field.name, String(value));
      }
    });
    return payload;
  }

  return resource.fields.reduce<Record<string, unknown>>((acc, field) => {
    if (field.type === "file") {
      return acc;
    }

    const rawValue = formState[field.name];
    if (field.type === "number") {
      acc[field.name] = rawValue === "" ? null : Number(rawValue);
    } else if (field.type === "checkbox") {
      acc[field.name] = Boolean(rawValue);
    } else if (field.type === "json") {
      acc[field.name] = rawValue ? JSON.parse(String(rawValue)) : [];
    } else {
      acc[field.name] = rawValue;
    }
    return acc;
  }, {});
}

function isImageField(key: string): boolean {
  return /(image|thumbnail|logo|banner)/i.test(key);
}

function isFileField(key: string): boolean {
  return /(document|file|image|thumbnail|logo|banner)/i.test(key);
}

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "No data available in table";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatShortValue(value: unknown): string {
  const formatted = formatDisplayValue(value);
  return formatted.length > 90 ? `${formatted.slice(0, 87)}...` : formatted;
}

function formatTimestamp(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function findToggleField(resource: AdminResourceConfig): AdminFieldConfig | undefined {
  return resource.fields.find((field) => field.name === "status" || field.name === "is_active");
}

function splitFields(resource: AdminResourceConfig) {
  const mediaFields = resource.fields.filter((field) => field.type === "file");
  const contentFields = resource.fields.filter(
    (field) => field.type === "textarea" || field.type === "json" || field.type === "datetime" || field.type === "date"
  );
  const primaryFields = resource.fields.filter(
    (field) => !mediaFields.includes(field) && !contentFields.includes(field)
  );

  return { primaryFields, contentFields, mediaFields };
}

interface AdminResourceManagerProps {
  config: AdminSectionConfig;
  initialResourceKey?: string;
  initialMode?: "list" | "form" | "upsert";
  listHref?: string;
  createHref?: string;
}

export function AdminResourceManager({
  config,
  initialResourceKey,
  initialMode = "list",
  listHref,
  createHref,
}: AdminResourceManagerProps) {
  const resources = config.resources ?? [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeKey, setActiveKey] = useState(initialResourceKey ?? resources[0]?.key ?? "");
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AdminRecord | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [optionsMap, setOptionsMap] = useState<Record<string, AdminSelectOption[]>>({});
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [mode, setMode] = useState<"list" | "form" | "detail">(
    initialMode === "list" ? "list" : "form"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const activeResource = useMemo(
    () => resources.find((resource) => resource.key === activeKey) ?? resources[0],
    [activeKey, resources]
  );

  useEffect(() => {
    if (!initialResourceKey || !resources.some((resource) => resource.key === initialResourceKey)) return;
    setActiveKey(initialResourceKey);
  }, [initialResourceKey, resources]);

  useEffect(() => {
    if (!activeResource) return;
    setSelectedRecord(null);
    setFormState(buildInitialFormState(activeResource, null));
    setSearch("");
    setSearchDraft("");
    setMode(initialMode === "list" ? "list" : "form");
    setError(null);
  }, [activeResource?.key, initialMode]);

  useEffect(() => {
    if (!activeResource) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [items, optionEntries] = await Promise.all([
          getAdminResource(activeResource.path, search),
          Promise.all(
            Array.from(new Set(activeResource.fields.map((field) => field.optionSource).filter(Boolean))).map(
              async (sourceKey) => {
                const endpoint = adminOptionSources[sourceKey as string];
                if (!endpoint) return [sourceKey as string, []] as const;
                const sourceRecords = await getAdminResource(endpoint);
                return [
                  sourceKey as string,
                  sourceRecords.map((item) => ({
                    value: (item.id as string | number) ?? "",
                    label:
                      (item.name as string) ??
                      (item.email as string) ??
                      (item.title as string) ??
                      String(item.id ?? ""),
                  })),
                ] as const;
              }
            )
          ),
        ]);

        if (!cancelled) {
          setRecords(items);
          setOptionsMap(Object.fromEntries(optionEntries));
          if (initialMode === "upsert") {
            const firstRecord = items[0] ?? null;
            setSelectedRecord(firstRecord);
            setFormState(buildInitialFormState(activeResource, firstRecord));
            setMode("form");
          } else if (selectedRecord?.id) {
            const refreshed = items.find((item) => item.id === selectedRecord.id) ?? null;
            setSelectedRecord(refreshed);
            if (mode !== "list") {
              setFormState(buildInitialFormState(activeResource, refreshed));
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeResource, initialMode, mode, reloadToken, search, selectedRecord?.id]);

  if (!activeResource) {
    return null;
  }

  const canCreate = activeResource.allowCreate !== false && !activeResource.readOnly;
  const canDelete = activeResource.allowDelete !== false && !activeResource.readOnly;
  const canEdit = !activeResource.readOnly;
  const isEditing = Boolean(selectedRecord?.id);
  const showListPanel = initialMode === "list" || mode === "list" || mode === "detail";
  const toggleField = findToggleField(activeResource);
  const { primaryFields, contentFields, mediaFields } = splitFields(activeResource);

  const updateResourceQuery = (resourceKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("resource", resourceKey);
    router.replace(`${pathname}?${params.toString()}` as Route);
  };

  const handleResourceChange = (resourceKey: string) => {
    setActiveKey(resourceKey);
    updateResourceQuery(resourceKey);
  };

  const openCreateForm = () => {
    if (createHref) {
      router.push(createHref as Route);
      return;
    }
    setSelectedRecord(null);
    setFormState(buildInitialFormState(activeResource, null));
    setMode("form");
    setError(null);
  };

  const openEditForm = (record: AdminRecord) => {
    setSelectedRecord(record);
    setFormState(buildInitialFormState(activeResource, record));
    setMode("form");
    setError(null);
  };

  const openDetails = (record: AdminRecord) => {
    setSelectedRecord(record);
    setMode(activeResource.readOnly ? "detail" : "list");
  };

  const resetView = () => {
    if (listHref && pathname !== listHref) {
      router.push(listHref as Route);
      return;
    }
    setSelectedRecord(null);
    setFormState(buildInitialFormState(activeResource, null));
    setMode(initialMode === "list" ? "list" : "form");
    setError(null);
  };

  const handleChange = (field: AdminFieldConfig, value: unknown) => {
    setFormState((current) => ({ ...current, [field.name]: value }));
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (activeResource.readOnly) return;

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(activeResource, formState);
      if (selectedRecord?.id) {
        await updateAdminResource(activeResource.path, Number(selectedRecord.id), payload);
      } else {
        await createAdminResource(activeResource.path, payload);
      }
      if (listHref && createHref && pathname === createHref) {
        router.push(listHref as Route);
      } else {
        resetView();
      }
      setReloadToken((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: AdminRecord) => {
    if (!record.id || !canDelete) return;
    setSaving(true);
    setError(null);
    try {
      await deleteAdminResource(activeResource.path, Number(record.id));
      if (selectedRecord?.id === record.id) {
        resetView();
      }
      setReloadToken((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (record: AdminRecord) => {
    if (!record.id || !toggleField) return;
    setSaving(true);
    setError(null);
    try {
      const currentValue = record[toggleField.name];
      const nextValue =
        toggleField.type === "checkbox"
          ? !Boolean(currentValue)
          : currentValue === "active"
            ? activeResource.key === "class-schedules"
              ? "inactive"
              : "disabled"
            : "active";
      await updateAdminResource(activeResource.path, Number(record.id), {
        [toggleField.name]: nextValue,
      });
      setReloadToken((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (record: AdminRecord, key: string) => {
    const value = resolveRecordValue(record, key);

    if (isImageField(key) && typeof value === "string" && value) {
      return (
        <img
          alt={key}
          className="h-[48px] w-[100px] rounded border border-slate-200 object-cover"
          src={getMediaUrl(value) ?? value}
        />
      );
    }

    if (isFileField(key) && typeof value === "string" && value) {
      return (
        <a
          className="inline-flex items-center gap-2 text-sm font-medium text-[#045330] underline-offset-2 hover:underline"
          href={getMediaUrl(value) ?? value}
          rel="noreferrer"
          target="_blank"
        >
          <i className="fa-solid fa-file" />
          <span>Open</span>
        </a>
      );
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (key.includes("status") && typeof value === "string") {
      const positive = value === "active" || value === "accepted" || value === "completed" || value === "paid";
      const warning = value === "pending" || value === "in_progress" || value === "success";
      return (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${
            positive
              ? "bg-emerald-100 text-emerald-700"
              : warning
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          {value.replace(/_/g, " ")}
        </span>
      );
    }

    if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
      return formatTimestamp(value);
    }

    return (
      <span className="block max-w-[320px] whitespace-normal break-words text-sm text-slate-700">
        {formatShortValue(value)}
      </span>
    );
  };

  const renderField = (field: AdminFieldConfig) => {
    const value = formState[field.name];
    const options = field.options ?? (field.optionSource ? optionsMap[field.optionSource] ?? [] : []);

    if (field.type === "textarea" || field.type === "json") {
      return (
        <textarea
          className="min-h-[120px] rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
          onChange={(event) => handleChange(field, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          value={String(value ?? "")}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
          onChange={(event) => handleChange(field, event.target.value)}
          value={String(value ?? "")}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={`${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="inline-flex h-11 items-center gap-3 rounded-md border border-slate-300 px-3 text-sm text-slate-700">
          <input
            checked={Boolean(value)}
            onChange={(event) => handleChange(field, event.target.checked)}
            type="checkbox"
          />
          <span>Enabled</span>
        </label>
      );
    }

    if (field.type === "file") {
      const currentFile =
        selectedRecord && typeof selectedRecord[field.name] === "string"
          ? String(selectedRecord[field.name])
          : "";

      return (
        <div className="space-y-3">
          <div className="flex h-[150px] w-[150px] items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
            {currentFile && isImageField(field.name) ? (
              <img alt={field.label} className="h-full w-full object-cover" src={getMediaUrl(currentFile) ?? currentFile} />
            ) : (
              <span className="text-5xl text-slate-300">
                <i className={`fa-solid ${isImageField(field.name) ? "fa-image" : "fa-file-lines"}`} />
              </span>
            )}
          </div>
          <input
            accept={field.accept}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#045330] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#03462A]"
            onChange={(event) => handleChange(field, event.target.files?.[0] ?? null)}
            type="file"
          />
          {currentFile ? (
            <p className="text-xs text-slate-500">Current file is already attached.</p>
          ) : null}
        </div>
      );
    }

    const inputType =
      field.type === "datetime" ? "datetime-local" :
      field.type === "date" ? "date" :
      field.type === "number" ? "number" :
      field.type;

    return (
      <input
        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
        onChange={(event) => handleChange(field, event.target.value)}
        placeholder={field.placeholder}
        type={inputType}
        value={String(value ?? "")}
      />
    );
  };

  const entryStart = records.length ? 1 : 0;
  const entryEnd = records.length;

  return (
    <div className="space-y-5">
      {showListPanel ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-medium text-slate-900">Manage {activeResource.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeResource.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {resources.length > 1 ? (
                <select
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                  onChange={(event) => handleResourceChange(event.target.value)}
                  value={activeResource.key}
                >
                  {resources.map((resource) => (
                    <option key={resource.key} value={resource.key}>
                      {resource.label}
                    </option>
                  ))}
                </select>
              ) : null}

              <form className="flex gap-2" onSubmit={handleSearch}>
                <input
                  className="h-10 min-w-[220px] rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder={`Search ${activeResource.singularLabel.toLowerCase()}...`}
                  value={searchDraft}
                />
                {search ? (
                  <button
                    className="rounded-md border border-[#045330] px-4 text-sm font-medium text-[#045330] transition hover:bg-[#F1F8F4]"
                    onClick={() => {
                      setSearch("");
                      setSearchDraft("");
                    }}
                    type="button"
                  >
                    All
                  </button>
                ) : null}
                <button
                  className="rounded-md border border-[#045330] bg-[#045330] px-4 text-sm font-medium text-white transition hover:bg-[#03462A]"
                  type="submit"
                >
                  Search
                </button>
              </form>

              {canCreate ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#045330] bg-[#045330] px-4 text-sm font-medium text-white transition hover:bg-[#03462A]"
                  onClick={openCreateForm}
                  type="button"
                >
                  <i className="fa-solid fa-plus" />
                  <span>Add New</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-left text-slate-900">
                <th className="whitespace-nowrap px-4 py-4 font-semibold">Sl</th>
                {activeResource.columns.map((column) => (
                  <th className="whitespace-nowrap px-4 py-4 font-semibold" key={column.key}>
                    {column.label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={activeResource.columns.length + 2}>
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={activeResource.columns.length + 2}>
                    No data available in table
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    className="border-b border-slate-200 bg-white transition hover:bg-slate-50"
                    key={String(record.id)}
                    onClick={() => openDetails(record)}
                  >
                    <td className="px-4 py-4 align-top text-slate-700">{index + 1}</td>
                    {activeResource.columns.map((column) => (
                      <td className="px-4 py-4 align-top text-slate-700" key={column.key}>
                        {renderCell(record, column.key)}
                      </td>
                    ))}
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {toggleField ? (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-emerald-500 text-emerald-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggle(record);
                            }}
                            type="button"
                          >
                            <i
                              className={`fa-solid ${
                                record[toggleField.name] === true || record[toggleField.name] === "active"
                                  ? "fa-toggle-on"
                                  : "fa-toggle-off"
                              }`}
                            />
                          </button>
                        ) : null}

                        {canEdit ? (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#045330] text-[#045330] transition hover:bg-[#F1F8F4]"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditForm(record);
                            }}
                            type="button"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                        ) : (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#17a2b8] text-[#17a2b8]"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetails(record);
                            }}
                            type="button"
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                        )}

                        {canDelete ? (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#dc3545] text-[#dc3545]"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(record);
                            }}
                            type="button"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {entryStart} to {entryEnd} of {records.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-slate-300 px-4 py-2 text-slate-400" disabled type="button">
              Previous
            </button>
            <button className="rounded-md border border-slate-300 px-4 py-2 text-slate-400" disabled type="button">
              Next
            </button>
          </div>
        </div>
        </section>
      ) : null}

      {mode === "form" ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-medium text-slate-900">
                {isEditing ? `Edit ${activeResource.singularLabel}` : `Create a new ${activeResource.singularLabel}`}
              </h2>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#045330] text-[#045330] transition hover:bg-[#F1F8F4]"
                onClick={resetView}
                type="button"
              >
                <i className="fa-solid fa-reply" />
              </button>
            </div>
          </div>

          <form className="p-5" onSubmit={handleSubmit}>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                    {activeResource.singularLabel} Information
                  </div>
                  <div className="grid gap-4 p-5">
                    {primaryFields.map((field) => (
                      <label className="grid gap-2" key={field.name}>
                        <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                        {renderField(field)}
                        {field.helperText ? <span className="text-xs text-slate-500">{field.helperText}</span> : null}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {contentFields.length ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-slate-200">
                    <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                      Content Body
                    </div>
                    <div className="grid gap-4 p-5">
                      {contentFields.map((field) => (
                        <label className="grid gap-2" key={field.name}>
                          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                          {renderField(field)}
                          {field.helperText ? <span className="text-xs text-slate-500">{field.helperText}</span> : null}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {mediaFields.length ? (
              <div className="mt-6 rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                  Media Uploads
                </div>
                <div className="grid gap-6 p-5 sm:grid-cols-2 xl:grid-cols-3">
                  {mediaFields.map((field) => (
                    <label className="grid gap-2" key={field.name}>
                      <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                      {renderField(field)}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {isEditing && canDelete ? (
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-[#dc3545] px-4 py-2 text-sm font-medium text-[#dc3545]"
                  onClick={() => {
                    if (selectedRecord) {
                      handleDelete(selectedRecord);
                    }
                  }}
                  type="button"
                >
                  <i className="fa-solid fa-trash" />
                  <span>Delete</span>
                </button>
              ) : null}
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[#045330] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#03462A]"
                disabled={saving}
                type="submit"
              >
                <i className="fa-solid fa-floppy-disk" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {mode === "detail" && selectedRecord ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-medium text-slate-900">{activeResource.singularLabel} Details</h2>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#045330] text-[#045330] transition hover:bg-[#F1F8F4]"
                onClick={resetView}
                type="button"
              >
                <i className="fa-solid fa-reply" />
              </button>
            </div>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {Object.entries(selectedRecord).map(([key, value]) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3" key={key}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{key}</p>
                <div className="mt-2 text-sm text-slate-700">
                  {typeof value === "string" && isImageField(key) && value ? (
                    <img alt={key} className="h-[120px] w-full max-w-[220px] rounded border border-slate-200 object-cover" src={getMediaUrl(value) ?? value} />
                  ) : (
                    formatShortValue(value)
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
