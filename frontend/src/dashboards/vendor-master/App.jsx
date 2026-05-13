import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Overview from "./pages/Overview";
import VendorMaster from "./pages/VendorMaster";
import { useDashboardData } from "./hooks/useDashboardData";
import "./styles/index.css";
import Banking from "./pages/Banking";
import TaxCompliance from "./pages/TaxCompliance";
import Geographic from "./pages/Geographic";

const PAGE_TITLES = {
  overview: "Overview",
  vendorMaster: "Vendor Master",
  banking: "Banking",
  taxCompliance: "Tax Compliance",
  geographic: "Geographic",
};

const EXPORT_PAGES = [
  { key: "overview", title: "Overview" },
  { key: "vendorMaster", title: "Vendor Master" },
  { key: "banking", title: "Banking" },
  { key: "taxCompliance", title: "Tax Compliance" },
  { key: "geographic", title: "Geographic" },
];

export default function VendorMasterApp() {
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

      case "vendorMaster":
        return <VendorMaster data={data} />;

      case "banking":
        return <Banking data={data} />;

      case "taxCompliance":
        return <TaxCompliance data={data} />;

      case "geographic":
        return <Geographic data={data} />;

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
                Fetching vendor master dashboard insights...
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="dashboard-error-overlay">
            <div className="dashboard-error-card">
              <div className="dashboard-error-title">Unable to load data</div>
              <div className="dashboard-error-subtitle">
                {error?.message || error || "Please refresh and try again."}
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