import React, { useMemo, useState } from "react";
import { customerMasterConfig } from "../configs/customerMaster.config";
import { mapCustomerMasterOverview } from "../mappers/customerMasterMapper";
import KpiCard from "../components/ui/KpiCard";
import DashboardChartRenderer from "../components/dashboard/DashboardChartRenderer";
import { getByPath } from "../utils/getByPath";
import { useInsights } from "../hooks/useDashboardData";

function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function getTopItem(items = [], valueKey = "value") {
  if (!Array.isArray(items) || items.length === 0) return null;

  return [...items].sort(
    (a, b) => toNumber(b[valueKey]) - toNumber(a[valueKey]),
  )[0];
}

function buildOverviewInsights(mappedData) {
  const customersByRegion = mappedData.customersByRegion || [];
  const tdsBreakdown = mappedData.tdsBreakdown || [];
  const bankCoverage = mappedData.bankCoverage || [];
  const topCities = mappedData.topCities || [];
  const bankCoverageByState = mappedData.bankCoverageByState || [];
  const reconciliationSplit = mappedData.reconciliationSplit || [];

  const topRegion = getTopItem(customersByRegion, "opening");
  const topTds = getTopItem(tdsBreakdown);
  const topCity = getTopItem(topCities);
  const topBankState = getTopItem(bankCoverageByState);
  const topRecon = getTopItem(reconciliationSplit);

  const withBank =
    bankCoverage.find((item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("with"),
    )?.value || 0;

  const noBank =
    bankCoverage.find((item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("no"),
    )?.value || 0;

  const totalBankCoverage = toNumber(withBank) + toNumber(noBank);
  const bankCoveragePct = totalBankCoverage
    ? ((toNumber(withBank) / totalBankCoverage) * 100).toFixed(1)
    : "0.0";

  const insights = [];
}

function GenAiInsightsPanel() {
  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    generate,
    hasGenerated,
  } = useInsights();

  const insightItems = insights?.insights || [];
  const insightSummary = insights?.summary || "";
  const insightCount = insights?.count || insightItems.length || 0;
  const insightModel = insights?.model || "Customer Analytics";
  const ragEnabled = Boolean(insights?.ragEnabled);

  return (
    <>
      <div className="section-label" style={{ marginTop: "20px" }}>
        Gen AI Insights
      </div>

      <div className="card ai-panel">
        <div className="ai-panel-header">
          <div className="ai-panel-brand">
            <div className="ai-panel-icon">✦</div>
            <div className="ai-panel-title-block">
              <div className="ai-panel-title">Decision Intelligence</div>
              <div className="ai-panel-subtitle">
                Powered by Generative AI Agents
              </div>
            </div>
          </div>

          <button
            className="insights-btn"
            onClick={generate}
            disabled={insightsLoading}
          >
            {insightsLoading
              ? "Analysing..."
              : hasGenerated
                ? "✦ Regenerate Insights"
                : "✦ Generate Insights"}
          </button>
        </div>

        <div className="ai-panel-body">
          {insightsLoading && (
  <div className="ai-loading show">
    <div className="ai-loading-dots">
      <span className="ai-loading-dot"></span>
      <span className="ai-loading-dot"></span>
      <span className="ai-loading-dot"></span>
    </div>

    <div className="ai-loading-text">
      Generating customer master insights...
    </div>
  </div>
)}

          {!insightsLoading && insightsError && (
            <div className="ai-error show">{insightsError}</div>
          )}

          {!insightsLoading && !insightsError && insightItems.length > 0 && (
            <div className="ai-result show">
              <div className="ai-summary-hero">
                <div className="ai-summary-label">Executive Summary</div>
                <div className="ai-summary-text">{insightSummary}</div>
              </div>

              <div className="ai-meta-strip">
                <div className="ai-meta-pill">Insights: {insightCount}</div>
                <div className="ai-meta-pill">Model: {insightModel}</div>
                <div className="ai-meta-pill">
                  RAG: {ragEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              <div className="ai-insights-list">
                {insightItems.map((item, idx) => (
                  <div key={idx} className="ai-insight-card">
                    <div className="ai-insight-card-header">
                      <div className="ai-insight-card-title">
                        <div className="ai-insight-index">{idx + 1}</div>
                        <div className="ai-insight-heading">
                          Insight {idx + 1}
                        </div>
                      </div>

                      <div className="ai-insight-tags-wrap">
                        <div className="ai-insight-tag category-tag">
                          {item.category || "General"}
                        </div>

                        <div
                          className={`ai-insight-tag severity-tag ${
                            String(item.severity || "").toLowerCase() === "high"
                              ? "severity-high"
                              : String(item.severity || "").toLowerCase() ===
                                  "medium"
                                ? "severity-medium"
                                : "severity-info"
                          }`}
                        >
                          {item.severity || "Info"}
                        </div>
                      </div>
                    </div>

                    <div className="ai-insight-card-body">
                      <div className="ai-insight-main">{item.insight}</div>

                      {item.reasoning?.length > 0 && (
                        <div className="ai-detail-section">
                          <div className="ai-detail-heading">Reasoning</div>
                          <ul className="ai-detail-list">
                            {item.reasoning.map((reason, reasonIndex) => (
                              <li key={reasonIndex}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.evidence?.length > 0 && (
                        <div className="ai-detail-section">
                          <div className="ai-detail-heading">Evidence</div>
                          <ul className="ai-detail-list evidence">
                            {item.evidence.map((evidence, evidenceIndex) => (
                              <li key={evidenceIndex}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.recommended_action && (
                        <div className="ai-detail-section">
                          <div className="ai-detail-heading">
                            Recommended Action
                          </div>

                          <div className="ai-recommendation-text">
                            <div className="ai-recommendation-content">
                              {item.recommended_action}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!insights && !insightsLoading && !insightsError && (
            <div className="ai-empty-state">
              Click the button above to generate AI-powered customer master
              insights.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Overview({ data }) {
  const mappedData = useMemo(() => mapCustomerMasterOverview(data), [data]);

  const chartRow1 = customerMasterConfig.charts.slice(0, 2);
  const chartRow2 = customerMasterConfig.charts.slice(2, 4);
  const chartRow3 = customerMasterConfig.charts.slice(4);

  return (
    <div>
      <div className="section-label">{customerMasterConfig.sectionLabel}</div>

      <div className="four-col">
        {customerMasterConfig.kpis.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={getByPath(mappedData, item.valuePath)}
            sub={getByPath(mappedData, item.subPath)}
            footer={getByPath(mappedData, item.footerPath)}
            iconName={item.iconName}
            accent={item.accent}
            sparkPct={item.sparkPct}
            badge={getByPath(mappedData, item.badgePath, item.badge)}
          />
        ))}
      </div>

      <GenAiInsightsPanel />

      <div className="two-col" style={{ marginTop: "20px" }}>
        {chartRow1.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>

      <div className="two-col" style={{ marginTop: "20px" }}>
        {chartRow2.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>
      <div className="two-col" style={{ marginTop: "20px" }}>
        {chartRow3.map((chart) => (
          <DashboardChartRenderer
            key={chart.title}
            chart={chart}
            data={mappedData}
          />
        ))}
      </div>
    </div>
  );
}
