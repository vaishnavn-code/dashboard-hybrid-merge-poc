import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Overview from "./pages/Overview";
import AccountType from "./pages/AccountType";
import AccountRange from "./pages/AccountRange";
import GlAccounts from "./pages/GlAccounts";
import { useDashboardData } from "./hooks/useDashboardData";
import { glMasterResponse } from "./data/glMasterResponse";
import "./styles/index.css";

const PAGE_TITLES = {
  overview: "Overview",
  accountType: "Account Type",
  accountRange: "Account Range",
  glAccounts: "GL Accounts",
};

export default function GlMasterApp() {
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [page, setPage] = useState("overview");
  const [darkMode, setDark] = useState(false);

  const { data, loading, error } = useDashboardData();

  const dashboardData = data || glMasterResponse;

  const toggleDark = () => {
    const next = !darkMode;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  const renderPage = () => {
    switch (page) {
      case "overview":
        return <Overview data={dashboardData} />;

      case "accountType":
        return <AccountType data={dashboardData} />;

      case "accountRange":
        return <AccountRange data={dashboardData} />;

      case "glAccounts":
        return <GlAccounts data={dashboardData} />;

      default:
        return <Overview data={dashboardData} />;
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

        <div className="page-content">{renderPage()}</div>
      </div>
    </div>
  );
}