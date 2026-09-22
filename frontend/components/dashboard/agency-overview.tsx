"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { getAgencyConsultants, getAgencyServices } from "@/lib/api/agencies";
import { getWalletTransactions } from "@/lib/api/payments";

export function AgencyOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: "0", consultants: 0, services: 0 });

  useEffect(() => {
    Promise.all([getWalletTransactions(), getAgencyConsultants(), getAgencyServices()])
      .then(([txns, consultants, services]) => {
        const totalIn = txns.filter((t) => t.transaction_type === "cash_in").reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
        const totalOut = txns.filter((t) => t.transaction_type === "cash_out").reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
        setStats({
          balance: (totalIn - totalOut).toFixed(0),
          consultants: consultants.length,
          services: services.filter((s) => s.active).length
        });
      })
      .catch(() => null);
  }, [user]);

  return (
    <div className="sd-section-stack">
      <section className="sd-card" style={{ padding: "1.5rem 1.5rem 1rem" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>
          Welcome back, {user?.first_name ?? "Agency"}! 👋
        </h2>
        <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>
          Manage your consultants, services, and business profile from your dashboard.
        </p>
      </section>

      <div className="sd-overview-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <article className="sd-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span className="ew-stat-icon ew-stat-icon--blue">
              <i className="fa-solid fa-wallet" />
            </span>
            <p className="ew-stat-label" style={{ margin: 0 }}>Balance</p>
          </div>
          <p className="ew-stat-value" style={{ margin: 0, fontSize: "1.5rem" }}>
            ৳ {parseFloat(stats.balance).toLocaleString()}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#64748B" }}>
            Your current wallet balance.
          </p>
        </article>

        <article className="sd-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span className="ew-stat-icon ew-stat-icon--purple">
              <i className="fa-solid fa-user-tie" />
            </span>
            <p className="ew-stat-label" style={{ margin: 0 }}>Consultants</p>
          </div>
          <p className="ew-stat-value" style={{ margin: 0, fontSize: "1.5rem" }}>
            {stats.consultants}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#64748B" }}>
            Consultants registered under your agency.
          </p>
        </article>

        <article className="sd-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span className="ew-stat-icon ew-stat-icon--green">
              <i className="fa-solid fa-gears" />
            </span>
            <p className="ew-stat-label" style={{ margin: 0 }}>Active Services</p>
          </div>
          <p className="ew-stat-value" style={{ margin: 0, fontSize: "1.5rem" }}>
            {stats.services}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "#64748B" }}>
            Published services from your agency.
          </p>
        </article>
      </div>
    </div>
  );
}
