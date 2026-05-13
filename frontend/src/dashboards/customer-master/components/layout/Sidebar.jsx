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

  customerMaster: (
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  ),

  banking: (
    <path d="M3 21h18v-2H3v2zm2-4h3V9H5v8zm5 0h3V9h-3v8zm5 0h3V9h-3v8zM12 2 3 7v1h18V7l-9-5z" />
  ),

  taxCompliance: (
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM13 9V3.5L18.5 9H13zm-2 9H8v-2h3v2zm5-4H8v-2h8v2z" />
  ),

  geographic: (
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
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
          <div style={styles.logoText}>Customer Analytics</div>
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

      {/* <div style={styles.sidebarFooter}>
        <div style={styles.footerPill}>● LIVE</div>
        <div style={styles.footerText}>Customer Master</div>
      </div> */}

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