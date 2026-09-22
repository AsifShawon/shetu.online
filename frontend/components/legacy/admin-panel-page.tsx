import Link from "next/link";

import type { AdminPage, AdminSection, InsightCard } from "@/lib/legacy-dashboard-data";
import { adminNavigation, adminPages } from "@/lib/legacy-dashboard-data";

function AdminOverviewCards({ cards }: { cards: InsightCard[] }) {
  return (
    <div className="legacy-admin-stat-grid">
      {cards.map((card) => (
        <article
          className={`legacy-admin-stat legacy-admin-stat--${card.accent ?? "default"}`}
          key={card.title}
        >
          <div>
            {card.meta ? <strong>{card.meta}</strong> : null}
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
          <span>More info</span>
        </article>
      ))}
    </div>
  );
}

function renderAdminBody(page: AdminPage) {
  if (page.layout === "overview") {
    return (
      <div className="legacy-admin-stack">
        <section className="legacy-admin-card">
          <h2>{page.welcomeTitle}</h2>
          <p>{page.welcomeText}</p>
        </section>
        <AdminOverviewCards cards={page.primaryCards} />
        {page.secondaryCards?.length ? (
          <div className="legacy-admin-chart-grid">
            {page.secondaryCards.map((card) => (
              <article className="legacy-admin-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="legacy-admin-chart-placeholder">Chart Area</div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (page.layout === "form") {
    return (
      <div className="legacy-admin-form-layout">
        <section className="legacy-admin-card">
          <div className="legacy-admin-header-row">
            <div>
              <h2>{page.title}</h2>
              <p>{page.subtitle}</p>
            </div>
            <button type="button">Edit</button>
          </div>
          <div className="legacy-admin-form-grid">
            {page.fields.map((field) => (
              <label className={field.wide ? "is-wide" : ""} key={field.label}>
                <span>{field.label}</span>
                <input readOnly value={field.value} />
              </label>
            ))}
          </div>
        </section>
        <aside className="legacy-admin-card">
          <h3>{page.sideCard.title}</h3>
          <ul className="legacy-admin-list">
            {page.sideCard.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button">{page.sideCard.action}</button>
        </aside>
      </div>
    );
  }

  if (page.layout === "cards") {
    return (
      <section className="legacy-admin-card">
        <div className="legacy-admin-header-row">
          <div>
            <h2>{page.title}</h2>
            <p>{page.subtitle}</p>
          </div>
        </div>
        <div className="legacy-admin-package-grid">
          {page.cards.map((card) => (
            <article className={card.featured ? "legacy-admin-package is-featured" : "legacy-admin-package"} key={card.name}>
              <div className="legacy-admin-package-badge">
                <span>{card.name}</span>
                <strong>{card.badge}</strong>
              </div>
              <h3>{card.price}</h3>
              <p>{card.description}</p>
              <button type="button">Update Package</button>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="legacy-admin-card">
      <div className="legacy-admin-header-row">
        <div>
          <h2>{page.title}</h2>
          <p>{page.subtitle}</p>
        </div>
        {page.actionLabel ? <button type="button">{page.actionLabel}</button> : null}
      </div>
      <div className="legacy-admin-table-wrap">
        <table className="legacy-admin-table">
          <thead>
            <tr>
              {page.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminPanelPage({ section }: { section: AdminSection }) {
  const page = adminPages[section];

  return (
    <div className="legacy-admin-panel">
      <aside className="legacy-admin-sidebar">
        <Link className="legacy-admin-brand" href="/admin">
          <img alt="Shetu" src="/shetu_logo.jpeg" className="h-8 w-auto rounded bg-white p-0.5 object-contain" />
          <span>Shetu Admin</span>
        </Link>
        <nav className="legacy-admin-nav">
          {adminNavigation.map((item) => (
            <Link className={item.key === section ? "is-active" : ""} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="legacy-admin-main">
        <header className="legacy-admin-topbar">
          <div className="legacy-admin-topbar-left">
            <button type="button">☰</button>
            <Link href="/">View Site</Link>
          </div>
          <div className="legacy-admin-topbar-right">
            <img alt="Admin" src="/avatar.png" />
            <span>Admin</span>
          </div>
        </header>

        <main className="legacy-admin-content">{renderAdminBody(page)}</main>
      </div>
    </div>
  );
}
