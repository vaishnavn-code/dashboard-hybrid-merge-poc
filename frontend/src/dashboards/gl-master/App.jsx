import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Overview from "./pages/Overview";
import AccountType from "./pages/AccountType";
import AccountRange from "./pages/AccountRange";
import GlAccounts from "./pages/GlAccounts";
import { useDashboardData } from "./hooks/useDashboardData";
import "./styles/index.css";

const PAGE_TITLES = {
  overview: "Overview",
  accountType: "Account Type",
  accountRange: "Account Range",
  glAccounts: "GL Accounts",
};

const EXPORT_PAGES = [
  { key: "overview", title: "Overview" },
  { key: "accountType", title: "Account Type" },
  { key: "accountRange", title: "Account Range" },
  { key: "glAccounts", title: "GL Accounts" },
];

export default function GlMasterApp() {
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [page, setPage] = useState("overview");
  const [darkMode, setDark] = useState(false);

  const { data, loading, error } = useDashboardData();

  const toggleDark = () => {
    const next = !darkMode;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  const renderPage = () => {
    switch (page) {
      case "overview":
        return <Overview data={data} />;

      case "accountType":
        return <AccountType data={data} />;

      case "accountRange":
        return <AccountRange data={data} />;

      case "glAccounts":
        return <GlAccounts data={data} />;

      default:
        return <Overview data={data} />;
    }
  };

  return (
    <div className="wrapper">
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="main-area">
        <Header
          title={PAGE_TITLES[page]}
          darkMode={darkMode}
          onToggleDark={toggleDark}
          activePage={page}
          setActivePage={setPage}
          setIsExportingFull={setIsExportingFull}
          setExportStatus={setExportStatus}
          exportPages={EXPORT_PAGES}
        />

        {loading && (
          <div className="dashboard-loader-overlay">
            <div className="dashboard-loader-card">
              <div className="dashboard-loader-spinner" />
              <div className="dashboard-loader-title">Loading data</div>
              <div className="dashboard-loader-subtitle">
                Fetching GL master dashboard insights...
              </div>
            </div>
          </div>
        )}

        {isExportingFull && (
          <div className="export-overlay" id="export-overlay">
            <div className="export-overlay-card">
              <div className="export-overlay-spinner" />

              <div className="export-overlay-title">Exporting PDF</div>

              <div className="export-overlay-subtitle">
                {exportStatus || "Preparing report..."}
              </div>

              <div className="export-overlay-note">
                Please wait while we capture all dashboard pages.
              </div>
            </div>
          </div>
        )}

        <div className="page-content">{renderPage()}</div>
      </div>
    </div>
  );
}
