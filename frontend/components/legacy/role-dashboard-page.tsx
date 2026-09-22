import Link from "next/link";

import type { DashboardRole, DashboardSection, DashboardPage, InsightCard } from "@/lib/legacy-dashboard-data";
import { roleConfigs, rolePages } from "@/lib/legacy-dashboard-data";

function DashboardOverviewCards({ cards }: { cards: InsightCard[] }) {
  return (
    <div className="legacy-dashboard-card-grid">
      {cards.map((card) => (
        <article
          key={card.title}
          className={`legacy-dashboard-content-card${card.accent ? ` legacy-dashboard-content-card--${card.accent}` : ""}`}
        >
          <h3>{card.title}</h3>
          <p>{card.description}</p>
          {card.meta ? <span>{card.meta}</span> : null}
        </article>
      ))}
    </div>
  );
}

function renderDashboardBody(page: DashboardPage) {
  if (page.layout === "overview") {
    return (
      <div className="legacy-dashboard-section-stack">
        <section className="legacy-dashboard-message">
          <h2>{page.welcomeTitle}</h2>
          <p>{page.welcomeText}</p>
        </section>
        <DashboardOverviewCards cards={page.primaryCards} />
        {page.secondaryCards?.length ? <DashboardOverviewCards cards={page.secondaryCards} /> : null}
      </div>
    );
  }

  if (page.layout === "form") {
    return (
      <div className="legacy-dashboard-form-layout">
        <section className="legacy-dashboard-panel">
          <div className="legacy-dashboard-panel-head">
            <div>
              <h2>{page.title}</h2>
              <p>{page.subtitle}</p>
            </div>
          </div>
          <div className="legacy-dashboard-form-grid">
            {page.fields.map((field) => (
              <label
                key={field.label}
                className={`legacy-dashboard-field${field.wide ? " legacy-dashboard-field--wide" : ""}`}
              >
                <span>{field.label}</span>
                <input readOnly value={field.value} />
              </label>
            ))}
          </div>
        </section>
        <aside className="legacy-dashboard-side-card">
          <h3>{page.sideCard.title}</h3>
          <ul>
            {page.sideCard.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button">{page.sideCard.action}</button>
        </aside>
      </div>
    );
  }

  if (page.layout === "gallery") {
    return (
      <section className="legacy-dashboard-panel">
        <div className="legacy-dashboard-panel-head">
          <div>
            <h2>{page.title}</h2>
            <p>{page.subtitle}</p>
          </div>
          <button type="button">Upload Image</button>
        </div>
        <div className="legacy-dashboard-gallery">
          {page.items.map((item) => (
            <article key={item.title} className="legacy-dashboard-gallery-card">
              <img alt={item.title} src={item.image} />
              <div>
                <h3>{item.title}</h3>
                <p>Legacy agency media card</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (page.layout === "report") {
    return (
      <div className="legacy-report-layout">
        <aside className="legacy-report-timeline">
          <ul>
            {page.timeline.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <a href={`#report-${index + 1}`}>{item}</a>
              </li>
            ))}
          </ul>
        </aside>
        <div className="legacy-report-sections">
          <section className="legacy-dashboard-panel">
            <div className="legacy-dashboard-panel-head">
              <div>
                <h2>{page.title}</h2>
                <p>{page.subtitle}</p>
              </div>
              <button type="button">Send To Student</button>
            </div>
          </section>
          {page.blocks.map((block, index) => (
            <section className="legacy-dashboard-panel" id={`report-${index + 1}`} key={block.title}>
              <h3>{block.title}</h3>
              <p>{block.body}</p>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>{page.title}</h2>
          <p>{page.subtitle}</p>
        </div>
        {page.actionLabel ? <button type="button">{page.actionLabel}</button> : null}
      </div>
      <div className="legacy-dashboard-table-wrap">
        <table className="legacy-dashboard-table">
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

export function RoleDashboardPage({
  role,
  section
}: {
  role: DashboardRole;
  section: DashboardSection;
}) {
  const config = roleConfigs[role];
  const page = rolePages[role][section];

  if (!page) {
    return null;
  }

  return (
    <div className={`legacy-role-dashboard legacy-role-dashboard--${config.accentClass}`}>
      <aside className="legacy-dashboard-sidebar">
        <div className="legacy-dashboard-brand">
          <img alt="Shetu" src={config.logo} />
        </div>
        <div className="legacy-dashboard-menu-title">Menu</div>
        <nav className="legacy-dashboard-nav">
          {config.nav.map((item) => (
            <Link
              className={item.key === section ? "is-active" : ""}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="legacy-dashboard-main">
        <header className="legacy-dashboard-topbar">
          <div className="legacy-dashboard-topbar-left">
            <button type="button">☰</button>
            <h1>{config.roleLabel}</h1>
          </div>
          <div className="legacy-dashboard-topbar-right">
            <span className="legacy-dashboard-lang">BN / EN</span>
            {config.badges.map((badge) => (
              <span className="legacy-dashboard-badge" key={badge}>
                {badge}
              </span>
            ))}
            <span className="legacy-dashboard-badge">{config.wallet}</span>
            <div className="legacy-dashboard-user">
              <img alt={config.userName} src="/no-profile-img.png" />
              <span>{config.userName}</span>
            </div>
          </div>
        </header>

        <main className="legacy-dashboard-content">
          <section
            className="legacy-dashboard-hero"
            style={{ backgroundImage: `url(${config.heroImage})` }}
          >
            {config.summary.length ? (
              <div className="legacy-dashboard-summary">
                {config.summary.map((item) => (
                  <article className="legacy-dashboard-summary-card" key={item.label}>
                    <div>
                      <p>{item.label}</p>
                      <h2>{item.value}</h2>
                    </div>
                    <img alt={item.label} src={item.icon} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="legacy-dashboard-summary legacy-dashboard-summary--empty" />
            )}
            <div className="legacy-dashboard-profile">
              <img alt={config.userName} src="/no-profile-img.png" />
              <h2>{config.userName}</h2>
            </div>
          </section>

          <section className="legacy-dashboard-actions">
            {config.actions.map((item) => (
              <Link href={item.href} key={item.href}>
                <img alt="" src={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </section>

          {renderDashboardBody(page)}
        </main>
      </div>
    </div>
  );
}
