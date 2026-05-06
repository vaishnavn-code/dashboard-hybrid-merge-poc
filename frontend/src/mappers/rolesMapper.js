export function mapRoles(rawData) {
  const rolesRaw = rawData?.roles || {};
  const charts = rolesRaw?.charts || {};
  const table = rolesRaw?.table || [];

  const rolesByAssignment = Object.entries(
    charts?.["Roles by Assignment"] || {}
  ).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));

  const roleDistribution = Object.entries(
    charts?.["Role Distribution"] || {}
  ).map(([name, value]) => ({
    name: name.toUpperCase(),
    value: Number(value || 0),
  }));

  const tableData = table.map((item, index) => ({
    id: index + 1,
    uid: item.uid || "-",
    name: item.name || "-",
    roleId: item.role_id || "-",
    roleDesc: item.role_desc || "-",
    startDate: item.start_date || "-",
    endDate: item.end_date || "-",
  }));

  return {
    rolesByAssignment,
    roleDistribution,
    tableData,
  };
}