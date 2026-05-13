import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formatted = now.toLocaleTimeString("en-GB", {
        hour12: false,
      });

      setTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="time-pill"
      id="clock"
      style={{ padding: "4px 10px", fontSize: ".68rem" }}
    >
      {time}
    </span>
  );
}

export default function Header({
  title,
  subtitle,
  activePage,
  setActivePage,
  darkMode,
  onToggleDark,
  setIsExportingFull,
  setExportStatus,
  exportPages = [],
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExport = async () => {
    setIsExportingPdf(true);
    setIsExportingFull(true);
    setExportStatus("Preparing report...");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pagesToExport =
      exportPages.length > 0
        ? exportPages
        : [{ key: activePage, title: title || activePage }];

    const originalActivePage = activePage;

    try {
      for (let i = 0; i < pagesToExport.length; i++) {
        const pageItem = pagesToExport[i];
        const pageKey = pageItem.key;
        const pageTitle = pageItem.title || pageKey;

        setExportStatus(
          `Exporting page ${i + 1} / ${pagesToExport.length}: ${pageTitle}`,
        );

        setActivePage(pageKey);

        await new Promise((resolve) => setTimeout(resolve, 2200));

        const fullPageEl = document.querySelector(".wrapper");
        if (!fullPageEl) continue;

        let dataUrl;

        try {
          dataUrl = await domtoimage.toPng(fullPageEl, {
            width: fullPageEl.scrollWidth * 2,
            height: fullPageEl.scrollHeight * 2,
            style: {
              transform: "scale(2)",
              transformOrigin: "top left",
              width: fullPageEl.scrollWidth + "px",
              height: fullPageEl.scrollHeight + "px",
              background: "#ffffff",
            },
            filter: (node) => {
              if (
                node.id === "export-overlay" ||
                node.id === "chart-tooltip" ||
                node.getAttribute?.("data-pdf-exclude") === "true"
              ) {
                return false;
              }

              return true;
            },
          });
        } catch (err) {
          console.error(`Capture failed for ${pageKey}`, err);
          continue;
        }

        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();

        const img = new Image();
        img.src = dataUrl;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const finalWidth = pageWidth;
        const finalHeight = (img.height * pageWidth) / img.width;

        pdf.addImage(dataUrl, "PNG", 0, 0, finalWidth, finalHeight);
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(/:/g, "");

      pdf.save(`customer-dashboard-full-report_${timestamp}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Check console (F12).");
    } finally {
      setActivePage(originalActivePage);
      setIsExportingFull(false);
      setExportStatus("");
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="header-bar">
      <div className="header-text">
        <span className="header-title">{title}</span>
        <span className="header-subtitle">{subtitle}</span>
      </div>

      <div className="header-actions">
        <span className="live-badge" style={{ fontSize: ".6rem" }}>
          Live
        </span>

        <LiveClock />

        <button
          className="pdf-btn"
          onClick={handleExport}
          disabled={isExportingPdf}
          style={{
            padding: "6px 12px",
            fontSize: ".72rem",
            opacity: isExportingPdf ? 0.85 : 1,
            cursor: isExportingPdf ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isExportingPdf ? (
            <>
              <span className="pdf-btn-spinner" />
              Exporting...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6" />
              </svg>
              Export PDF
            </>
          )}
        </button>

        <button
          className="icon-btn"
          title={darkMode ? "Light mode" : "Dark mode"}
          onClick={onToggleDark}
        >
          {darkMode ? (
            <svg viewBox="0 0 24 24">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}