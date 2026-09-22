"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SuggestionInput } from "@/components/form/suggestion-fields";
import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getStudentChoices, createStudentChoice, updateStudentChoice, deleteStudentChoice,
  type StudentChoice
} from "@/lib/api/students";
import { getCountries, getServices } from "@/lib/api/catalog";
import { getSubjectSuggestionList } from "@/lib/shared-suggestion-catalog";

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

export function StudentChoices() {
  const { t } = useLang();
  const { showToast } = useToast();
  const [choices, setChoices]   = useState<StudentChoice[]>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const [services, setServices]  = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading]    = useState(true);
  const [showForm, setShowForm]  = useState(false);
  const [editId, setEditId]      = useState<number | null>(null);
  const [expanded, setExpanded]  = useState<number | null>(null);
  const [search, setSearch]      = useState("");
  const [infoClosed, setInfoClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    country_id: "", service_id: "", institute: "", subject: "", session: "", budget: ""
  });
  const subjectSuggestions = useMemo(() => getSubjectSuggestionList(), []);

  const load = () => {
    Promise.allSettled([getStudentChoices(), getCountries(), getServices()])
      .then(([choiceResult, countryResult, serviceResult]) => {
        const ch = takeFulfilledValue(choiceResult) ?? [];
        const co = takeFulfilledValue(countryResult) ?? [];
        const sv = takeFulfilledValue(serviceResult) ?? [];

        setChoices(ch);
        setCountries(co.filter((c) => c.status === "active"));
        setServices(sv.filter((s) => s.status === "active"));

        const failedKeys = [
          choiceResult.status === "rejected" ? "choices" : null,
          countryResult.status === "rejected" ? "countries" : null,
          serviceResult.status === "rejected" ? "services" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some choice data could not sync",
            message: `The page loaded with partial data while ${failedKeys.join(", ")} were unavailable.`,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openEdit = (c: StudentChoice) => {
    setEditId(c.id);
    setForm({
      country_id: String(c.country_id), service_id: String(c.service_id),
      institute: c.institute, subject: c.subject, session: c.session, budget: c.budget
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        country_id: Number(form.country_id), service_id: Number(form.service_id),
        institute: form.institute, subject: form.subject, session: form.session, budget: form.budget
      };
      if (editId) await updateStudentChoice(editId, payload);
      else         await createStudentChoice(payload);
      setShowForm(false);
      setEditId(null);
      showToast({
        variant: "success",
        title: editId ? "Choice updated" : "Choice created",
        message: editId
          ? "Your study choice changes were saved."
          : "Your new study choice was saved.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Choice save failed",
        message: getApiErrorMessage(error, "Unable to save the choice."),
      });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("choice_delete_confirm"))) return;
    try {
      await deleteStudentChoice(id);
      showToast({
        variant: "success",
        title: "Choice deleted",
        message: "The selected choice was removed.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this choice."),
      });
    }
  };

  const filtered = choices.filter((c) => {
    const q = search.toLowerCase();
    return !q ||
      (c.country_name ?? "").toLowerCase().includes(q) ||
      (c.service_name ?? "").toLowerCase().includes(q) ||
      c.institute.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.budget.toLowerCase().includes(q);
  });

  return (
    <div className="sd-section-stack">
      {/* Page breadcrumb */}
      <div className="sd-breadcrumb">
        <Link href="/dashboard/student">{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>{t("choice_page_title")}</span>
      </div>

      {/* Info banner */}
      {!infoClosed && (
        <div className="sd-info-banner">
          <button type="button" className="sd-info-close" onClick={() => setInfoClosed(true)}>
            <i className="fa-solid fa-xmark" />
          </button>
          <h3>{t("choice_info_heading")}</h3>
          <p>{t("choice_info_text")}</p>
        </div>
      )}

      {/* Table container */}
      <div className="sd-card">
        {/* Card header */}
        <div className="sd-card-header">
          <div className="sd-card-header-left">
            <img src="/legacy/Frontend/assets/icons/edit.png" alt="" className="sd-card-icon" />
            <h3>{t("choice_page_title")}</h3>
          </div>
          <Link href={"/dashboard/student/choices/create" as Route} className="sd-btn-primary">
            {t("choice_create_btn")}
          </Link>
        </div>

        {/* Sub-header with search */}
        <div className="sd-card-subheader">
          <div className="sd-card-subheader-left">
            <i className="fa-solid fa-list-check sd-subheader-icon" />
            <span>{t("choice_table_title")}</span>
          </div>
          <div className="sd-search-wrap">
            <i className="fa-solid fa-magnifying-glass sd-search-icon" />
            <input
              type="text"
              className="sd-search-input"
              placeholder={t("choice_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Create / Edit form */}
        {showForm && editId !== null && (
          <div className="sd-form-section">
            <h4 className="sd-form-title">{editId ? t("choice_edit_title") : t("choice_add_title")}</h4>
            <form className="sd-form-grid" onSubmit={handleSubmit}>
              <div>
                <label className="sd-label">{t("choice_country_label")}</label>
                <select className="sd-field" required value={form.country_id} onChange={handleChange("country_id")}>
                  <option value="">-- Select Country --</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="sd-label">{t("choice_service_label")}</label>
                <select className="sd-field" required value={form.service_id} onChange={handleChange("service_id")}>
                  <option value="">-- Select Service --</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="sd-label">{t("choice_institute_label")}</label>
                <input className="sd-field" placeholder="Institute name" value={form.institute} onChange={handleChange("institute")} />
              </div>
              <div>
                <SuggestionInput
                  label={t("choice_subject_label")}
                  placeholder="Search or type a subject"
                  value={form.subject}
                  suggestions={subjectSuggestions}
                  helper="Common subjects are suggested, and custom subjects are still allowed."
                  onChange={(value) => setForm((prev) => ({ ...prev, subject: value }))}
                />
              </div>
              <div>
                <label className="sd-label">{t("choice_session_label")}</label>
                <input className="sd-field" placeholder="e.g. Fall 2027" value={form.session} onChange={handleChange("session")} />
              </div>
              <div>
                <label className="sd-label">{t("choice_budget_label")}</label>
                <input className="sd-field" placeholder="Budget amount" value={form.budget} onChange={handleChange("budget")} />
              </div>
              <div className="sd-form-actions">
                <button type="submit" className="sd-btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : t("choice_save")}
                </button>
                <button
                  type="button"
                  className="sd-btn-outline"
                  onClick={() => { setShowForm(false); setEditId(null); }}
                >
                  {t("choice_cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table header row */}
        <div className="sd-table-header-row">
          <div className="sd-th-id">#</div>
          <div className="sd-th">{t("choice_col_service")}</div>
          <div className="sd-th sd-th--desktop">{t("choice_col_country")}</div>
          <div className="sd-th sd-th--desktop">{t("choice_col_institute")}</div>
          <div className="sd-th sd-th--desktop">{t("choice_col_budget")}</div>
          <div className="sd-th sd-th--desktop">{t("choice_col_subject")}</div>
        </div>

        {/* Accordion rows */}
        {loading ? (
          <p className="sd-loading">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="sd-empty-state">
            <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="No data"
              onError={(e) => { (e.target as HTMLImageElement).src = "/legacy/Frontend/assets/img/icon/login.png"; }} />
            <p className="sd-empty-title">{t("choice_no_data")}</p>
            <p className="sd-empty-help">{t("choice_no_data_help")}</p>
            <Link href={"/dashboard/student/choices/create" as Route} className="sd-btn-primary mt-4">
              {t("choice_create_btn")}
            </Link>
          </div>
        ) : (
          filtered.map((c, i) => (
            <div key={c.id} className="sd-accordion">
              {/* Accordion header */}
              <div
                className={`sd-accordion-head ${expanded === c.id ? "is-open" : ""}`}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="sd-acc-id"><span>{i + 1}</span></div>
                <div className="sd-acc-cell sd-acc-cell--bold">{c.service_name ?? c.service_id}</div>
                <div className="sd-acc-cell sd-acc-cell--desktop">{c.country_name ?? c.country_id}</div>
                <div className="sd-acc-cell sd-acc-cell--desktop">{c.institute || "—"}</div>
                <div className="sd-acc-cell sd-acc-cell--desktop">{c.budget ? `${c.budget} BDT` : "—"}</div>
                <div className="sd-acc-cell sd-acc-cell--desktop" style={{ borderRight: "none" }}>{c.subject || "—"}</div>
                <div className="sd-acc-toggle">
                  <i className={`fa-solid fa-chevron-down ${expanded === c.id ? "rotated" : ""}`} />
                </div>
              </div>

              {/* Accordion body */}
              {expanded === c.id && (
                <div className="sd-accordion-body">
                  <div className="sd-acc-details">
                    <div className="sd-acc-detail-item">
                      <i className="fa-solid fa-earth-americas" />
                      <div><span>Country</span><p>{c.country_name ?? "—"}</p></div>
                    </div>
                    <div className="sd-acc-detail-item">
                      <i className="fa-solid fa-building-columns" />
                      <div><span>Institute</span><p>{c.institute || "—"}</p></div>
                    </div>
                    <div className="sd-acc-detail-item">
                      <i className="fa-solid fa-book" />
                      <div><span>Subject</span><p>{c.subject || "—"}</p></div>
                    </div>
                    <div className="sd-acc-detail-item">
                      <i className="fa-solid fa-calendar-days" />
                      <div><span>Session</span><p>{c.session || "—"}</p></div>
                    </div>
                    <div className="sd-acc-detail-item">
                      <i className="fa-solid fa-sack-dollar" />
                      <div><span>Budget</span><p>{c.budget ? `${c.budget} BDT` : "—"}</p></div>
                    </div>
                    <div className="sd-acc-detail-actions">
                      <Link
                        href={`/dashboard/consultants-of-eduwise?choice_id=${c.id}` as Route}
                        className="sd-btn-primary sd-btn-sm"
                      >
                        <i className="fa-solid fa-user-tie mr-1" />
                        {t("choice_choose_consultant")}
                      </Link>
                      <button
                        type="button"
                        className="sd-btn-outline sd-btn-sm"
                        onClick={() => openEdit(c)}
                      >
                        <i className="fa-solid fa-pen-to-square mr-1" />
                        {t("choice_update")}
                      </button>
                      <button
                        type="button"
                        className="sd-btn-danger sd-btn-sm"
                        onClick={() => handleDelete(c.id)}
                      >
                        <i className="fa-solid fa-trash-can mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
