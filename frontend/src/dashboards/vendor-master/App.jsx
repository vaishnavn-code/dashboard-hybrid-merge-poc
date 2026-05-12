import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Overview from "./pages/Overview";
import VendorMaster from "./pages/VendorMaster";
import { useDashboardData } from "./hooks/useDashboardData";
import { Spinner, ErrorMsg } from "./components/ui/helpers";
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

export default function VendorMasterApp() {
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [page, setPage] = useState("overview");
  const [darkMode, setDark] = useState(false);

  const { data, loading, error } = useDashboardData();

  // IMPORTANT:
  // If API data is not available yet, use local vendor response.

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
        />

        <div className="page-content">{renderPage()}</div>
      </div>
    </div>
  );
}