"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import {
  createPayoutMethod,
  createWithdrawal,
  deletePayoutMethod,
  getAssessmentSettlements,
  getBalanceSummary,
  getPayoutMethods,
  getWalletTransactions,
  getWithdrawals,
  type AssessmentSettlement,
  type BalanceSummary,
  type PayoutMethod,
  type WalletTransaction,
  type WithdrawalRequest,
} from "@/lib/api/payments";

export function ConsultantBalance() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [settlements, setSettlements] = useState<AssessmentSettlement[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    method_type: "mobile_banking" as "mobile_banking" | "bank_account",
    account_holder_name: "",
    mobile_bank_type: "",
    mobile_bank_number: "",
    bank_name: "",
    account_number: "",
    branch_name: ""
  });

  const [withdrawForm, setWithdrawForm] = useState({ payout_method_id: "", amount: "", notes: "" });

  const load = () => {
    Promise.all([
      getWalletTransactions(),
      getPayoutMethods(),
      getWithdrawals(),
      getBalanceSummary(),
      getAssessmentSettlements()
    ])
      .then(([txns, methods, withdrawalItems, summary, settlementItems]) => {
        setTransactions(txns);
        setPayoutMethods(methods);
        setWithdrawals(withdrawalItems);
        setBalanceSummary(summary);
        setSettlements(settlementItems);
      })
      .catch(() => {
        setTransactions([]);
        setPayoutMethods([]);
        setWithdrawals([]);
        setBalanceSummary(null);
        setSettlements([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const walletBalance = transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.amount || "0");
    return transaction.transaction_type === "cash_in" ? sum + amount : sum - amount;
  }, 0);

  const releasedBalance = parseFloat(balanceSummary?.released_balance ?? "0");
  const holdingBalance = parseFloat(balanceSummary?.holding_balance ?? "0");
  const withdrawableBalance = parseFloat(balanceSummary?.withdrawable_balance ?? "0");
  const minimumReserve = parseFloat(balanceSummary?.minimum_reserve ?? "0");

  const setPF = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPayoutForm((current) => ({ ...current, [key]: event.target.value }));
  const setWF = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setWithdrawForm((current) => ({ ...current, [key]: event.target.value }));

  const handlePayoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createPayoutMethod(payoutForm as Partial<PayoutMethod>);
      setShowPayoutForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createWithdrawal({
        payout_method_id: Number(withdrawForm.payout_method_id),
        amount: withdrawForm.amount,
        notes: withdrawForm.notes
      });
      setShowWithdrawForm(false);
      setWithdrawForm({ payout_method_id: "", amount: "", notes: "" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "completed" || status === "released") return "bg-green-100 text-green-700";
    if (status === "rejected" || status === "refunded") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Link href="/dashboard/consultant" className="hover:text-primary transition-colors">Dashboard</Link>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Wallet & Balance</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">Wallet & Settlements</h2>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Wallet Ledger", value: walletBalance, color: "text-slate-900", bg: "bg-white", icon: "fa-wallet" },
          { label: "Released", value: releasedBalance, color: "text-emerald-600", bg: "bg-emerald-50/50", icon: "fa-circle-check" },
          { label: "Holding", value: holdingBalance, color: "text-amber-600", bg: "bg-amber-50/50", icon: "fa-clock" },
          { label: "Minimum Reserve", value: minimumReserve, color: "text-primary", bg: "bg-primary/5", icon: "fa-shield-halved" }
        ].map((card) => (
          <div key={card.label} className={cn("flex flex-col gap-3 rounded-3xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md", card.bg)}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</span>
              <i className={cn("fa-solid text-slate-300", card.icon)} />
            </div>
            <p className={cn("text-xl font-black", card.color)}>৳ {card.value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      {/* Main Actions */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section className="flex flex-1 flex-col gap-6">
          {/* Balance Card */}
          <div className="overflow-hidden rounded-[2.5rem] bg-primary p-8 text-white shadow-xl shadow-primary/20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Withdrawable Balance</p>
                <h3 className="mt-2 text-4xl font-black">৳ {withdrawableBalance.toLocaleString()}</h3>
              </div>
              <button 
                type="button" 
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-primary transition-all hover:bg-sky-50 active:scale-95 shadow-lg" 
                onClick={() => setShowWithdrawForm((value) => !value)}
              >
                <i className="fa-solid fa-money-bill-transfer" />
                {showWithdrawForm ? "Close Form" : "Request Withdrawal"}
              </button>
            </div>

            {showWithdrawForm && (
              <div className="mt-8 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-top-4">
                <h4 className="mb-6 text-lg font-black">New Withdrawal Request</h4>
                {payoutMethods.length === 0 ? (
                  <div className="rounded-2xl bg-white/10 p-6 text-center">
                    <p className="text-sm font-bold text-white/80">Please add a payout method below before requesting a withdrawal.</p>
                  </div>
                ) : (
                  <form className="grid gap-4" onSubmit={handleWithdrawSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Payout Method</label>
                        <select 
                          className="h-12 rounded-xl border-none bg-white/10 px-4 text-sm font-bold text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50" 
                          required 
                          value={withdrawForm.payout_method_id} 
                          onChange={setWF("payout_method_id")}
                        >
                          <option value="" className="text-slate-900">-- Select Method --</option>
                          {payoutMethods.map((method) => (
                            <option key={method.id} value={method.id} className="text-slate-900">
                              {method.account_holder_name} — {method.method_type === "mobile_banking" ? method.mobile_bank_type : method.bank_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Amount (BDT)</label>
                        <input 
                          className="h-12 rounded-xl border-none bg-white/10 px-4 text-sm font-bold text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50" 
                          required 
                          placeholder="Min ৳ 500" 
                          value={withdrawForm.amount} 
                          onChange={setWF("amount")} 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Notes (optional)</label>
                      <textarea 
                        className="rounded-xl border-none bg-white/10 p-4 text-sm font-bold text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/50" 
                        rows={2} 
                        placeholder="Additional details..."
                        value={withdrawForm.notes} 
                        onChange={setWF("notes")} 
                      />
                    </div>
                    <p className="text-[10px] font-medium text-white/40 italic">
                      * A minimum reserve of ৳ {minimumReserve.toLocaleString()} must remain in your account.
                    </p>
                    <button 
                      type="submit" 
                      className="mt-2 h-12 rounded-xl bg-white text-sm font-black text-primary transition-all hover:bg-sky-50 active:scale-95 disabled:opacity-50" 
                      disabled={submitting}
                    >
                      {submitting ? "Processing..." : "Confirm Withdrawal"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="flex flex-col gap-4">
            <h3 className="px-2 text-xl font-black text-slate-900">Recent Transactions</h3>
            {loading ? (
              <div className="py-20 text-center text-sm font-bold text-slate-400">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="rounded-[2.5rem] bg-white p-12 text-center shadow-sm border border-slate-100">
                <i className="fa-solid fa-receipt mb-4 text-4xl text-slate-100" />
                <p className="text-sm font-bold text-slate-400">No transactions found.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {transactions.map((transaction) => {
                  const isCredit = transaction.transaction_type === "cash_in";
                  return (
                    <div key={transaction.id} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl text-lg",
                          isCredit ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                          <i className={cn("fa-solid", isCredit ? "fa-arrow-down-left" : "fa-arrow-up-right")} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900">{isCredit ? "Credit" : "Debit"}</h4>
                          <p className="truncate text-[10px] font-medium text-slate-400">
                            {transaction.payment_method || "System"} • {transaction.invoice_number || "REF-000"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-black", isCredit ? "text-emerald-600" : "text-rose-600")}>
                          {isCredit ? "+" : "-"} ৳ {parseFloat(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-300">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-6 lg:w-80 lg:shrink-0">
          {/* Payout Methods */}
          <div className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Payout Methods</h3>
              <button 
                type="button" 
                className="h-8 w-8 rounded-full bg-slate-50 text-primary transition-all hover:bg-primary hover:text-white"
                onClick={() => setShowPayoutForm((v) => !v)}
              >
                <i className={cn("fa-solid", showPayoutForm ? "fa-minus" : "fa-plus")} />
              </button>
            </div>

            {showPayoutForm && (
              <form className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 animate-in fade-in zoom-in-95" onSubmit={handlePayoutSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</label>
                  <select className="h-10 rounded-xl border-slate-200 text-xs font-bold" value={payoutForm.method_type} onChange={setPF("method_type")}>
                    <option value="mobile_banking">Mobile Banking</option>
                    <option value="bank_account">Bank Account</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Holder</label>
                  <input className="h-10 rounded-xl border-slate-200 text-xs font-bold" required placeholder="Full name" value={payoutForm.account_holder_name} onChange={setPF("account_holder_name")} />
                </div>
                {payoutForm.method_type === "mobile_banking" ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank</label>
                      <select className="h-10 rounded-xl border-slate-200 text-xs font-bold" value={payoutForm.mobile_bank_type} onChange={setPF("mobile_bank_type")}>
                        <option value="">-- Select --</option>
                        {["bKash", "Nagad", "Rocket", "Upay"].map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Number</label>
                      <input className="h-10 rounded-xl border-slate-200 text-xs font-bold" placeholder="01XXXXXXXXX" value={payoutForm.mobile_bank_number} onChange={setPF("mobile_bank_number")} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</label>
                      <input className="h-10 rounded-xl border-slate-200 text-xs font-bold" placeholder="Bank name" value={payoutForm.bank_name} onChange={setPF("bank_name")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account No.</label>
                      <input className="h-10 rounded-xl border-slate-200 text-xs font-bold" placeholder="Account number" value={payoutForm.account_number} onChange={setPF("account_number")} />
                    </div>
                  </>
                )}
                <button type="submit" className="mt-2 h-10 rounded-xl bg-primary text-xs font-black text-white shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Method"}
                </button>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {payoutMethods.length === 0 ? (
                <div className="py-4 text-center text-xs font-bold text-slate-400 italic">No payout methods yet.</div>
              ) : (
                payoutMethods.map((method) => (
                  <div key={method.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{method.method_type === "mobile_banking" ? "Mobile" : "Bank"}</span>
                      <button 
                        className="text-rose-500 transition-colors hover:text-rose-700"
                        onClick={async () => {
                          if (window.confirm("Delete?")) {
                            await deletePayoutMethod(method.id);
                            load();
                          }
                        }}
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                    <p className="text-xs font-black text-slate-900 leading-tight">{method.account_holder_name}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {method.method_type === "mobile_banking" ? `${method.mobile_bank_type} — ${method.mobile_bank_number}` : `${method.bank_name} — ${method.account_number}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settlements */}
          {settlements.length > 0 && (
            <div className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50">
              <h3 className="mb-4 text-lg font-black text-slate-900">Pending Settlements</h3>
              <div className="flex flex-col gap-3">
                {settlements.map((settlement) => (
                  <div key={settlement.id} className="flex flex-col gap-1 border-l-2 border-primary/20 pl-4 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Order #{settlement.assessment_id}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        statusColor(settlement.status)
                      )}>
                        {settlement.status}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-800">৳ {parseFloat(settlement.net_amount).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-400 italic">
                      Release: {settlement.hold_until ? new Date(settlement.hold_until).toLocaleDateString() : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>

  );
}
