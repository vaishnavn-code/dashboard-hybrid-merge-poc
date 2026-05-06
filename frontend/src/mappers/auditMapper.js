export function mapAudit(rawData) {
  const auditRaw = rawData?.audit_log || {};
  const kpi = auditRaw?.kpi || {};
  const charts = auditRaw?.charts || {};
  const table = auditRaw?.table || [];

  const dailyCounts = table.reduce((acc, item) => {
    const date = item.date || "-";
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dailyAuditTrend = Object.entries(dailyCounts).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));

  const topUserActivity = Object.entries(charts?.["Top User Activity"] || {})
    .map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }))
    .sort((a, b) => b.value - a.value);

  const userActivityRanking = topUserActivity;

  const auditEventClassification = Object.entries(
    charts?.["Audit Event Classification"] || {}
  ).map(([label, value]) => ({
    role: label,
    count: Number(String(value || "0").replace("%", "")),
  }));

  const tableData = table.map((item, index) => ({
    id: index + 1,
    date: item.date || "-",
    time: item.time || "-",
    uid: item.uid || "-",
    group: item.group || "-",
    tcode: item.tcode || "-",
    program: item.program || "-",
    auditClass: item.audit_class || "-",
    email: item.email || "-",
  }));

  return {
    kpis: {
      dateRange: {
        title: kpi?.Date_Range?.Title || "",
        subtitle: kpi?.Date_Range?.Subtitle || "",
        footer: kpi?.Date_Range?.Footer || "",
      },
      totalEvents: {
        title: Number(kpi?.Total_Events?.Title || 0),
        subtitle: kpi?.Total_Events?.Subtitle || "",
        footer: kpi?.Total_Events?.Footer || "",
      },
      mostActiveUser: {
        title: kpi?.Most_ActiveUser?.Title || "",
        subtitle: kpi?.Most_ActiveUser?.Subtitle || "",
        footer: kpi?.Most_ActiveUser?.Footer || "",
      },
      mostUsedTcode: {
        title: kpi?.Most_used_Tcode?.Title || "",
        subtitle: kpi?.Most_used_Tcode?.Subtitle || "",
        footer: kpi?.Most_used_Tcode?.Footer || "",
      },
    },

    dailyAuditTrend,
    userActivityRanking,
    topUserActivity,
    auditEventClassification,
    tableData,
  };
}