import KpiCard from "../ui/KpiCard";
import { getByPath } from "../../utils/getByPath";

export default function DashboardKpiGrid({ config, data }) {
  return (
    <div className="four-col">
      {config.map((item) => {
        const value = item.valuePath
          ? getByPath(data, item.valuePath)
          : item.value;

        const sub = item.subPath
          ? getByPath(data, item.subPath)
          : item.sub;

        const footer = item.footerPath
          ? getByPath(data, item.footerPath)
          : item.footer;

        return (
          <KpiCard
            key={item.label}
            label={item.label}
            value={value}
            sub={sub}
            footer={footer}
            iconName={item.iconName}
            accent={item.accent || "c1"}
            sparkPct={item.sparkPct}
            badge={item.badge}
          />
        );
      })}
    </div>
  );
}