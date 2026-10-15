"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getConsultantDashboardSummary,
  type ConsultantDashboardRequest,
  type ConsultantDashboardSummary,
} from "@/lib/api/consultants";
import { getWalletTransactions, type WalletTransaction } from "@/lib/api/payments";

type WalletSnapshot = {
  balance: number;
  totalDeposited: number;
  totalWithdrawal: number;
  totalIncome: number;
};

type ActivityRow = {
  id: string;
  name: string;
  detail: string;
  date: string;
  amount: string;
  amountTone: "positive" | "negative" | "neutral";
  note: string;
  status: string;
};

function formatCurrency(value: string | number, locale: string) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return `BDT ${amount.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function buildWalletSnapshot(transactions: WalletTransaction[]): WalletSnapshot {
  const totalDeposited = transactions
    .filter((item) => item.transaction_type === "cash_in")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalWithdrawal = transactions
    .filter((item) => item.transaction_type === "cash_out")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    balance: totalDeposited - totalWithdrawal,
    totalDeposited,
    totalWithdrawal,
    totalIncome: totalDeposited + totalWithdrawal,
  };
}

function requestToActivity(item: ConsultantDashboardRequest): ActivityRow {
  return {
    id: `request-${item.id}`,
    name: item.student_name || "Student Request",
    detail: item.service_title || item.assessment_title || "Service name",
    date: item.created_at ?? "",
    amount: String(item.charge ?? 0),
    amountTone: "neutral",
    note: item.country_name || "Service request",
    status: item.status || "Pending",
  };
}

function walletToActivity(item: WalletTransaction): ActivityRow {
  const isDeposit = item.transaction_type === "cash_in";

  return {
    id: `wallet-${item.id}`,
    name: isDeposit ? "Wallet Deposit" : "Wallet Withdrawal",
    detail: item.payment_method || item.invoice_number || "Service name",
    date: item.created_at ?? "",
    amount: `${isDeposit ? "+" : "-"} ${item.amount ?? "0"}`,
    amountTone: isDeposit ? "positive" : "negative",
    note: isDeposit ? "Deposit" : "Withdraw",
    status: isDeposit ? "Completed" : "Running",
  };
}

function formatActivityAmount(raw: string, tone: ActivityRow["amountTone"], locale: string) {
  const normalized = raw.replace(/^[+-]\s*/, "").replace(/BDT\s*/i, "").trim();
  const amount = formatCurrency(normalized || "0", locale);
  if (tone === "neutral") {
    return amount;
  }

  return `${raw.trim().startsWith("-") ? "-" : "+"} ${amount}`;
}

const statIconMap = [
  { label: "Total Earnings", icon: "fa-regular fa-money-bill-1", tone: "blue" },
  { label: "Total Review", icon: "fa-solid fa-star", tone: "gold" },
  { label: "Total Request", icon: "fa-regular fa-copy", tone: "purple" },
  { label: "Completed Request", icon: "fa-solid fa-clipboard-check", tone: "green" },
] as const;

export function ConsultantOverview() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<ConsultantDashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wallet, setWallet] = useState<WalletSnapshot>({
    balance: 0,
    totalDeposited: 0,
    totalWithdrawal: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConsultantDashboardSummary(), getWalletTransactions()])
      .then(([dashboardSummary, walletTransactions]) => {
        setSummary(dashboardSummary);
        setTransactions(walletTransactions);
        setWallet(buildWalletSnapshot(walletTransactions));
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Consultant dashboard failed to load",
          message: getApiErrorMessage(error, "Unable to load consultant dashboard data."),
        });
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : user?.email ?? "Consultant Name";
  const completion = user?.profile_completion ?? summary?.stats.profile_completion ?? 0;
  const completionPercent = Math.max(0, Math.min(completion, 100));
  const isBangla = lang === "bn";
  const locale = isBangla ? "bn-BD" : "en-BD";
  const copy = isBangla
    ? {
      loading: "লোড হচ্ছে...",
      profileProgress: "আপনার প্রোফাইল অগ্রগতি",
      updateProfile: t("consultant_update_profile"),
      totalIncome: "মোট আয়",
      totalDeposited: "মোট জমা",
      totalWithdrawal: "মোট উত্তোলন",
      balance: t("dash_balance_label"),
      manageBalance: "ব্যালেন্স দেখুন",
      recentActivity: "সাম্প্রতিক কার্যক্রম",
      noRecentActivity: "এখনো কোনো সাম্প্রতিক কার্যক্রম নেই।",
      viewAll: "সব দেখুন",
      names: "নাম",
      date: "তারিখ",
      activity: "কার্যক্রম",
      transaction: "লেনদেন",
      status: "অবস্থা",
      totalReview: "মোট রিভিউ",
    }
    : {
      loading: "Loading consultant workspace...",
      profileProgress: "Your Profile progress",
      updateProfile: "Update Profile",
      totalIncome: "Total Income",
      totalDeposited: "Total Deposited",
      totalWithdrawal: "Total Withdrawal",
      balance: "Balance",
      manageBalance: "Manage Balance",
      recentActivity: "Recent Activity",
      noRecentActivity: "No recent activity yet.",
      viewAll: "View all",
      names: "Names",
      date: "Date",
      activity: "Activity",
      transaction: "Transaction",
      status: "Status",
      totalReview: "Total Review",
    };

  const statusLabels: Record<string, string> = isBangla
    ? {
      Completed: "সম্পন্ন",
      Running: "চলমান",
      Incomplete: "অসম্পূর্ণ",
      Pending: "অপেক্ষমাণ",
      pending: "অপেক্ষমাণ",
      accepted: "গৃহীত",
      approved: "অনুমোদিত",
      rejected: "বাতিল",
      revision_requested: "সংশোধন অনুরোধ",
    }
    : {};

  const noteLabels: Record<string, string> = isBangla
    ? {
      Deposit: "জমা",
      Withdraw: "উত্তোলন",
      "Service request": "সেবা অনুরোধ",
      "shortly Reason": "সংক্ষিপ্ত কারণ",
      Pending: "অপেক্ষমাণ",
    }
    : {};

  const stats = [
    { label: t("dash_earnings"), value: formatCurrency(summary?.stats.total_earnings ?? 0, locale) },
    { label: copy.totalReview, value: String(summary?.stats.total_reviews ?? 0) },
    { label: t("dash_total_request"), value: String(summary?.stats.total_requests ?? 0) },
    { label: t("dash_completed_request"), value: String(summary?.stats.completed_requests ?? 0) },
  ];

  const activities = useMemo(() => {
    const requestRows = (summary?.recent_requests ?? []).slice(0, 2).map(requestToActivity);
    const walletRows = transactions.slice(0, 4).map(walletToActivity);
    return [...requestRows, ...walletRows].slice(0, 4);
  }, [summary?.recent_requests, transactions]);

  if (loading || !summary) {
    return <p className="sd-loading">{copy.loading}</p>;
  }

  return (
    <div className="sd-section-stack sd-consultant-dashboard">
      <section className="sd-consultant-dash-hero">
        <div className="sd-consultant-hero-profile">
          <div
            className="sd-consultant-progress-ring"
            style={{
              background: `conic-gradient(#063a99 ${completionPercent * 3.6}deg, #e6e6e6 0deg)`,
            }}
          >
            <div>{completionPercent}%</div>
          </div>

          <div className="sd-consultant-hero-copy">
            <h2>{displayName}</h2>
            <p>{copy.profileProgress} {completionPercent}%</p>
            <Link href={"/dashboard/consultant/profile" as Route} className="sd-consultant-update-btn">
              <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
              {copy.updateProfile}
            </Link>
          </div>
        </div>

        <div className="sd-consultant-dash-stats">
          {stats.map((item, index) => {
            const icon = statIconMap[index];
            return (
              <article className="sd-consultant-dash-stat" key={item.label}>
                <span className={`sd-consultant-stat-icon is-${icon.tone}`}>
                  <i className={icon.icon} aria-hidden="true" />
                </span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sd-consultant-finance-card">
        <div className="sd-consultant-finance-list">
          <p>
            <i className="fa-solid fa-arrow-trend-up is-up" aria-hidden="true" />
            <span>{copy.totalIncome}</span>
            <strong>{formatCurrency(wallet.totalIncome, locale)}</strong>
          </p>
          <p>
            <i className="fa-solid fa-arrow-trend-up is-up" aria-hidden="true" />
            <span>{copy.totalDeposited}</span>
            <strong>{formatCurrency(wallet.totalDeposited, locale)}</strong>
          </p>
          <p>
            <i className="fa-solid fa-arrow-trend-down is-down" aria-hidden="true" />
            <span>{copy.totalWithdrawal}</span>
            <strong>{formatCurrency(wallet.totalWithdrawal, locale)}</strong>
          </p>
        </div>

        <div className="sd-consultant-finance-balance">
          <span>{copy.balance}</span>
          <strong>{formatCurrency(wallet.balance, locale)}</strong>
          <Link href={"/dashboard/consultant/balance" as Route}>
            <i className="fa-solid fa-wallet" aria-hidden="true" />
            {copy.manageBalance}
          </Link>
        </div>
      </section>

      <div className="sd-consultant-activity-head">
        <h2>{copy.recentActivity}</h2>
        <Link href={"/dashboard/consultant/balance" as Route}>{copy.viewAll}</Link>
      </div>

      <section className="sd-consultant-activity-card">
        <div className="sd-consultant-activity-table">
          <div className="sd-consultant-activity-row is-head">
            <span>{copy.names}</span>
            <span>{copy.date}</span>
            <span>{copy.activity}</span>
            <span>{copy.transaction}</span>
            <span>{copy.status}</span>
          </div>

          {activities.length === 0 ? (
            <p className="sd-empty-inline">{copy.noRecentActivity}</p>
          ) : (
            activities.map((item) => (
              <div className="sd-consultant-activity-row" key={item.id}>
                <div className="sd-consultant-activity-user">
                  <img src="/legacy/no-profile-img.png" alt="" aria-hidden="true" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </span>
                </div>
                <span>{formatDate(item.date, locale)}</span>
                <span>{noteLabels[item.note] ?? item.note}</span>
                <span className={`sd-consultant-activity-amount is-${item.amountTone}`}>
                  <strong>{formatActivityAmount(item.amount, item.amountTone, locale)}</strong>
                </span>
                <strong>{statusLabels[item.status] ?? item.status}</strong>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
