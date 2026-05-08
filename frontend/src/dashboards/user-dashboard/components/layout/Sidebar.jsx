/**
 * components/layout/Sidebar.jsx
 * ==============================
 * Left navigation sidebar — now uses the exportPDF utility so the PDF
 * accurately captures CSS variables, chart canvases, and custom fonts.
 */

import React, { useEffect, useState } from 'react';  // ← new import
import FSlogo from '../../images/FSlogo.png';
/* ── Nav item definition (unchanged) ───────────────────────────────────── */
const NAV_ITEMS = [
  {
    id: 'overview', label: 'Overview',
    icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  },
  {
    id: 'analytics', label: 'Analytics',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  },
  { type: 'divider' },
  { type: 'label', text: 'Data Layers' },
  {
    id: 'users', label: 'Users', badge: 'L1',
    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  },
  {
    id: 'roles', label: 'Roles', badge: 'L2',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
  {
    id: 'tcodes', label: 'T-Codes', badge: 'L3',
    icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  },
  { type: 'divider' },
  {
    id: 'audit', label: 'Audit Log',
    icon: 'M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.72L13 17v5h5l-1.22-1.22C19.91 19.07 22 15.76 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.76 2.09 7.07 5.22 8.78L6 22h5V2.05z',
  },
  {
    id: 'combined', label: 'Combined View',
    icon: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
  },
];

/* ── Component ──────────────────────────────────────────────────────────── */
export default function Sidebar({ activePage, onNavigate }) {


  return (
    <aside style={styles.sidebar}>
      {/* ── Logo ── */}
      <div style={styles.logoWrap}>
<img src={FSlogo} alt="TFSIN Logo" style={{ width: 40, height: 40, borderRadius: 9}} />
        {/* <div style={styles.logoIcon}> */}
          {/* <svg viewBox="0 0 24 24" width={18} height={18} fill="#fff">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.83-2.6 7.4-6 8.53C9.6 18.4 6 14.83 6 11V7.67L12 5z"/>
          </svg> */}
        {/* </div> */}
        <div>
          <div style={styles.logoText}>SYSTEM GOVERNANCE</div>
          <div style={styles.logoSub}></div>
        </div>
      </div>

      {/* ── Nav links ── */}
      <div style={styles.sectionLabel}>Navigation</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'divider')
            return <div key={i} style={styles.divider} />;
          if (item.type === 'label')
            return <div key={i} style={styles.sectionLabel}>{item.text}</div>;

          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(isActive ? styles.navBtnActive : {}) }}
              onClick={() => onNavigate(item.id)}
            >
              <svg viewBox="0 0 24 24" width={17} height={17}
                   fill="currentColor" style={{ flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
              {item.badge && <span style={styles.badge}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom controls ── */}


      {/* Spinner keyframes — injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
}

/* ── Inline styles (unchanged from original) ────────────────────────────── */
const styles = {
  sidebar: {
    width: 220, flexShrink: 0,
    background: 'var(--white)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    padding: '0 0 24px', position: 'sticky', top: 0,
    height: '100vh', overflowY: 'auto',
    boxShadow: '2px 0 12px rgba(21,101,192,.07)',
    transition: 'background .4s',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '22px 18px 20px',
    borderBottom: '1px solid var(--border)', marginBottom: 12,
  },
  logoIcon: {
    width: 34, height: 34,
    background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))',
    borderRadius: 9, display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(30,136,229,.35)',
  },
  logoText : { fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue-dark)' },
  logoSub  : { fontSize: '.45rem', fontWeight: 600, letterSpacing: '.2em',
               color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 },
  sectionLabel: {
    fontSize: '.57rem', fontWeight: 800, letterSpacing: '.18em',
    color: 'var(--text-muted)', textTransform: 'uppercase',
    padding: '4px 14px 2px',
  },
  nav     : { display: 'flex', flexDirection: 'column', gap: 3, padding: '0 10px', flex: 1 },
  navBtn  : {
    fontFamily: 'var(--font)', fontSize: '.79rem', fontWeight: 500,
    padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
    background: 'transparent', color: 'var(--text-muted)',
    transition: 'all .2s', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 9,
  },
  navBtnActive: {
    background: 'var(--blue-pale)', color: 'var(--blue-dark)', fontWeight: 700,
    boxShadow: 'inset 0 0 0 1px var(--blue-light)',
  },
  badge   : { fontSize: '.6rem', opacity: .7, marginLeft: 'auto' },
  divider : { height: 1, background: 'var(--border)', margin: '10px 16px' },
  bottom  : { padding: '0 10px', marginTop: 'auto' },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--teal-pale)', border: '1px solid rgba(0,172,193,.3)',
    color: 'var(--teal)', fontSize: '.68rem', fontWeight: 700,
    padding: '5px 12px', borderRadius: 20, letterSpacing: '.1em',
    textTransform: 'uppercase',
  }
};