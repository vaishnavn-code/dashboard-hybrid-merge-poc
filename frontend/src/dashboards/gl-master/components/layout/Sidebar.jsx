/**
 * components/layout/Sidebar.jsx
 * ==============================
 * Left navigation sidebar for Customer Master dashboard.
 */

import React, { useMemo } from "react";
import { NAV_PAGES } from "../../utils/constants";
import FSlogo from "../../data/images/FSlogo.png";

const NAV_ICONS = {
  overview: (
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  ),

  accountType: (
    <path
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z
          m-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
    />
  ),

  accountRange: (
    <path
      d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4
          6.3-6.29L22 12V6z"
    />
  ),

  glAccounts: (
    <path
      d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z
          m2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
    />
  ),
};

export default function Sidebar({ activePage, onNavigate }) {
  const sections = useMemo(() => {
    const map = {};

    NAV_PAGES.forEach((page) => {
      if (!map[page.section]) {
        map[page.section] = [];
      }

      map[page.section].push(page);
    });

    return map;
  }, []);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoWrap}>
        <img
          src={FSlogo}
          alt="FS Logo"
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            objectFit: "contain",
          }}
        />

        <div>
          <div style={styles.logoText}>GL Customer Analytics</div>
          <div style={styles.logoSub}>GL Master Dashboard</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {Object.entries(sections).map(([section, pages], index) => (
          <div key={section}>
            {index > 0 && <div style={styles.divider} />}

            <div style={styles.sectionLabel}>{section}</div>

            {pages.map((page) => {
              const isActive = activePage === page.id;

              return (
                <button
                  key={page.id}
                  type="button"
                  style={{
                    ...styles.navBtn,
                    ...(isActive ? styles.navBtnActive : {}),
                  }}
                  onClick={() => onNavigate(page.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={17}
                    height={17}
                    fill="currentColor"
                    style={{ flexShrink: 0 }}
                  >
                    {NAV_ICONS[page.id] || NAV_ICONS.overview}
                  </svg>

                  <span>{page.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: "var(--white)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 18px",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    boxShadow: "2px 0 12px rgba(21,101,192,.07)",
    transition: "background .4s",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "18px 18px 22px",
    borderBottom: "1px solid var(--border)",
    marginBottom: 14,
  },

  logoText: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "var(--blue-dark)",
    lineHeight: 1.1,
  },

  logoSub: {
    fontSize: ".55rem",
    fontWeight: 800,
    letterSpacing: ".16em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    marginTop: 5,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 10px",
    flex: 1,
  },

  sectionLabel: {
    fontSize: ".62rem",
    fontWeight: 900,
    letterSpacing: ".2em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    padding: "12px 14px 8px",
  },

  navBtn: {
    width: "100%",
    fontFamily: "var(--font)",
    fontSize: ".86rem",
    fontWeight: 600,
    padding: "11px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "var(--text-muted)",
    transition: "all .2s",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  navBtnActive: {
    background: "var(--blue-pale)",
    color: "var(--blue-dark)",
    fontWeight: 800,
    boxShadow: "inset 0 0 0 1px var(--blue-light)",
  },

  divider: {
    height: 1,
    background: "var(--border)",
    margin: "14px 16px 8px",
  },

  sidebarFooter: {
    borderTop: "1px solid var(--border)",
    padding: "14px 14px 0",
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  footerPill: {
    alignSelf: "flex-start",
    border: "1px solid #80deea",
    background: "#e0f7fa",
    color: "#00acc1",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: ".68rem",
    fontWeight: 900,
    letterSpacing: ".08em",
  },

  footerText: {
    color: "var(--text-muted)",
    fontSize: ".72rem",
    fontWeight: 700,
  },
};
