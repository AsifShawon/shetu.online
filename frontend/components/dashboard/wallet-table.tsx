"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { getWalletTransactions, type WalletTransaction } from "@/lib/api/payments";

export function WalletTable() {
  const { t } = useLang();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWalletTransactions()
      .then(setTransactions)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const balance = transactions.reduce((sum, t) => {
    const amount = parseFloat(t.amount || "0");
    return t.transaction_type === "cash_in" ? sum + amount : sum - amount;
  }, 0);

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href="/dashboard/student">{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>Balance</span>
      </div>

      <div className="sd-card">
        <div className="sd-card-header">
          <div className="sd-card-header-left">
            <span className="sd-card-icon sd-card-icon--font">
              <i className="fa-solid fa-wallet" />
            </span>
            <h3>Balance and Transactions</h3>
          </div>
          <div className="sd-card-header-right">
            <span className="sd-badge sd-badge--balance">BDT {balance.toLocaleString("en-BD")}</span>
            <button type="button" className="sd-btn-primary">
              Add Money
            </button>
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
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sd-empty-inline">
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {transactions.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span className={`sd-status ${t.transaction_type === "cash_in" ? "sd-status--green" : "sd-status--red"}`}>
                        {t.transaction_type === "cash_in" ? "Top Up" : "Deduction"}
                      </span>
                    </td>
                    <td className={t.transaction_type === "cash_in" ? "sd-amount sd-amount--positive" : "sd-amount sd-amount--negative"}>
                      {t.transaction_type === "cash_in" ? "+" : "-"}৳ {parseFloat(t.amount).toLocaleString("en-BD")}
                    </td>
                    <td>{t.payment_method ?? "—"}</td>
                    <td>{t.bank_transaction_id ?? t.invoice_number ?? "—"}</td>
                    <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
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
