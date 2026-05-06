export function mapTcode(rawData) {
  const tcodeRaw = rawData?.["t-code"] || {};
  const charts = tcodeRaw?.charts || {};
  const table = tcodeRaw?.table || [];

  const tcodesPerRole = Object.entries(
    charts?.["Tcodes per Role"] || {}
  ).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));

  const tcodeRoleTypeDistribution = Object.entries(
    charts?.["Tcode per Role Type"] || {}
  )
    .map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }))
    .filter((item) => item.value > 0);

  const tableData = table.map((item, index) => ({
    id: index + 1,
    roleId: item.Role_Id || "-",
    roleDesc: item.Role_Desc || "-",
    tCode: item.T_Code || "-",
    tcodeDesc: item.Tcode_desc || "-",
  }));

  return {
    tcodesPerRole,
    tcodeRoleTypeDistribution,
    tableData,
  };
}