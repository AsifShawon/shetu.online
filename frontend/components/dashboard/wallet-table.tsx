"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createTopupOrder,
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/api/payments";

export function WalletTable() {
  const { user } = useAuth();
  const { t } = useLang();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupNotice, setTopupNotice] = useState<string | null>(null);

  const load = () => {
    getWalletTransactions()
      .then(setTransactions)
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Wallet load failed",
          message: getApiErrorMessage(error, "Could not load wallet transactions."),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const balance = transactions.reduce((sum, tr) => {
    const amount = parseFloat(tr.amount || "0");
    return tr.transaction_type === "cash_in" ? sum + amount : sum - amount;
  }, 0);

  const dashboardHref = user?.role === "agency" ? "/dashboard/agency" : "/dashboard/student";

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupNotice(null);

    const amountNum = parseFloat(topupAmount);
    if (!Number.isFinite(amountNum) || amountNum < 10) {
      showToast({
        variant: "warning",
        title: "Minimum top-up",
        message: "Please enter an amount of at least 10 BDT.",
      });
      return;
    }

    setTopupSubmitting(true);
    try {
      const response = await createTopupOrder(amountNum);

      if (response.checkout_url) {
        showToast({
          variant: "info",
          title: "Redirecting to payment gateway",
          message: "Opening secure checkout session...",
        });
        window.location.href = response.checkout_url;
        return;
      }

      if (response.payment_configured === false) {
        setTopupNotice(
          response.message ||
            "Online payment gateway is not configured on this environment. Sandbox or live merchant credentials are required to initiate payments."
        );
      } else {
        setTopupNotice(
          "Payment gateway session could not be created. Please contact support or try again later."
        );
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to initiate top-up. The payment gateway may be unavailable."
      );
      setTopupNotice(message);
      showToast({
        variant: "error",
        title: "Top-up failed",
        message,
      });
    } finally {
      setTopupSubmitting(false);
    }
  };

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href={dashboardHref as any}>{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>Balance & Wallet</span>
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
            <span className="sd-badge sd-badge--balance">
              BDT {balance.toLocaleString("en-BD")}
            </span>
            <button
              type="button"
              className="sd-btn-primary"
              onClick={() => {
                setTopupNotice(null);
                setTopupAmount("");
                setTopupOpen(true);
              }}
            >
              Add Money
            </button>
          </div>
        </div>

        <div className="sd-table-wrap">
          {loading ? (
            <p className="sd-loading">Loading transactions…</p>
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
                {transactions.map((tr, i) => (
                  <tr key={tr.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span
                        className={`sd-status ${
                          tr.transaction_type === "cash_in"
                            ? "sd-status--green"
                            : "sd-status--red"
                        }`}
                      >
                        {tr.transaction_type === "cash_in" ? "Top Up" : "Deduction"}
                      </span>
                    </td>
                    <td
                      className={
                        tr.transaction_type === "cash_in"
                          ? "sd-amount sd-amount--positive"
                          : "sd-amount sd-amount--negative"
                      }
                    >
                      {tr.transaction_type === "cash_in" ? "+" : "-"}৳{" "}
                      {parseFloat(tr.amount).toLocaleString("en-BD")}
                    </td>
                    <td>{tr.payment_method ?? "—"}</td>
                    <td>{tr.bank_transaction_id ?? tr.invoice_number ?? "—"}</td>
                    <td>{tr.created_at ? new Date(tr.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {topupOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/48 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-dialog-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="topup-dialog-title" className="text-lg font-bold text-slate-800">
                Top Up Wallet
              </h3>
              <button
                type="button"
                onClick={() => setTopupOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {topupNotice ? (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 leading-relaxed">
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 text-amber-600" />
                  <div>
                    <strong className="block font-bold">Payment Gateway Unavailable</strong>
                    <span>{topupNotice}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleTopupSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Amount to add (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="any"
                    required
                    placeholder="e.g. 500"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    disabled={topupSubmitting}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-8 pr-4 text-sm font-bold text-slate-800 focus:border-[#045330] focus:outline-none focus:ring-2 focus:ring-[#045330]/20"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Minimum top-up amount is ৳ 10. Powered by official payment gateway.
                </p>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTopupOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  disabled={topupSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupSubmitting}
                  className="rounded-xl bg-[#045330] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#03462A] disabled:opacity-50"
                >
                  {topupSubmitting ? "Connecting Gateway..." : "Proceed to Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
