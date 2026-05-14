import { useMemo, useState } from "react";
import { getByPath } from "../../utils/getByPath";
import DonutChart from "../charts/DonutChart";
import DonutLegend from "../charts/DonutLegend";
import { GroupedBar } from "../charts/BarCharts";
import {
  HorizontalBar,
  AdditionVsRedemptionChart,
  PortfolioProductTrendChart,
  VerticalBar,
  VerticalBarWithLineOverview,
  StackedBarOnly,
} from "../charts/BarCharts";

export default function DashboardChartRenderer({ chart, data }) {
  const [controlValue, setControlValue] = useState(
    chart.controls?.defaultValue || null,
  );

  const [limit, setLimit] = useState(chart.defaultLimit || null);

  const rawChartData = getByPath(data, chart.dataPath, []);

  const chartData = useMemo(() => {
    if (!Array.isArray(rawChartData)) return [];

    if (!limit) return rawChartData;

    return rawChartData.slice(0, Number(limit));
  }, [rawChartData, limit]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">{chart.title}</div>
          {chart.subtitle && (
            <div className="chart-subtitle">{chart.subtitle}</div>
          )}
        </div>

        <div className="chart-controls">
          {chart.limitOptions?.length > 0 && (
            <select
              className="chart-limit-select"
              value={limit || ""}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              {chart.limitOptions.map((option) => (
                <option key={option} value={option}>
                  Top {option}
                </option>
              ))}
            </select>
          )}

          {chart.controls && (
            <>
              {chart.controls.badge && (
                <span className="chart-badge">{chart.controls.badge}</span>
              )}

              {chart.controls.options?.length > 0 && (
                <div className="chart-toggle">
                  {chart.controls.options.map((option) => (
                    <button
                      key={option}
                      className={option === controlValue ? "active" : ""}
                      onClick={() => setControlValue(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {chart.controls.helperText && (
                <span className="chart-helper-text">
                  {chart.controls.helperText}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {chart.type === "horizontalBar" && <HorizontalBar data={chartData} />}

      {chart.type === "groupedBar" && (
        <GroupedBar
          data={chartData}
          series={chart.series}
          nameKey="name"
          height={320}
        />
      )}

      {chart.type === "stackedBar" && (
        <StackedBarOnly
          data={chartData}
          height={chart.height || 320}
          xKey={chart.xKey || "name"}
          series={chart.series}
          barSize={chart.barSize || 34}
          slantLabels={chart.slantLabels}
        />
      )}

      {chart.type === "donut" && (
        <>
          <DonutChart
            data={chartData}
            colors={
              chart.colors || ["#0B2E6B", "#1976D2", "#2EA3F2", "#90CAF9"]
            }
            height={300}
          />

          <DonutLegend
            data={chartData}
            colors={
              chart.colors || ["#0B2E6B", "#1976D2", "#2EA3F2", "#90CAF9"]
            }
            showPercent
            showValue
          />
        </>
      )}

      {chart.type === "bar" && <AdditionVsRedemptionChart data={chartData} />}

      {chart.type === "trend" && (
        <PortfolioProductTrendChart data={chartData} />
      )}

      {chart.type === "verticalBar" && (
        <VerticalBar
          data={chartData}
          dataKey="value"
          nameKey="name"
          height={320}
          barSize={36}
          axis={chart.axis}
          slantLabels={chart.slantLabels}
          formatter={(value) => Number(value || 0).toLocaleString("en-IN")}
        />
      )}

      {chart.type === "verticalBarWithLine" && (
        <VerticalBarWithLineOverview
          data={chartData}
          height={460}
          viewMode={controlValue?.toLowerCase() || "monthly"}
          axis={chart.axis}
          barSize={chart.barSize}
          slantLabels={chart.slantLabels}
        />
      )}
    </div>
  );
}
