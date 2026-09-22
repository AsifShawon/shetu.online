"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { getQuotations, type Quotation } from "@/lib/api/marketplace";

export function QuotationsTable() {
  const { t } = useLang();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuotations()
      .then(setQuotations)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const statusClass = (status: string) => {
    if (status === "active") return "sd-status sd-status--green";
    if (status === "sent") return "sd-status sd-status--blue";
    if (status === "pending") return "sd-status sd-status--yellow";
    return "sd-status sd-status--purple";
  };

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href="/dashboard/student">{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>Quotations</span>
      </div>

      <div className="sd-card">
        <div className="sd-card-header">
          <div className="sd-card-header-left">
            <span className="sd-card-icon sd-card-icon--font">
              <i className="fa-solid fa-file-invoice-dollar" />
            </span>
            <h3>Quotations</h3>
          </div>
        </div>

        <div className="sd-table-wrap">
          {loading ? (
            <p className="sd-loading">Loading…</p>
          ) : (
            <table className="sd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Post</th>
                  <th>Consultant</th>
                  <th>Quotation</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sd-empty-inline">
                      No quotations received yet.
                    </td>
                  </tr>
                )}
                {quotations.map((q, i) => (
                  <tr key={q.id}>
                    <td>{i + 1}</td>
                    <td>{q.post_title ?? "—"}</td>
                    <td>{q.consultant_name ?? "—"}</td>
                    <td className="sd-truncate">{q.quotation}</td>
                    <td>{q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <span className={statusClass(q.status)}>{q.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
