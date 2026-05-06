export function mapAnalytics(rawData) {
  const analyticsRaw = rawData?.analytics || {};
  const kpi = analyticsRaw?.kpi || {};
  const charts = analyticsRaw?.charts || {};

  const roleAssignmentsRaw =
    charts?.["Top Role Assignments by Role ID"] || {};

  const topRoleAssignments = Object.entries(roleAssignmentsRaw).map(
    ([role, item]) => ({
      name: role,
      value: Number(item?.user_count || 0),
    }),
  );

  const tcodesPerRole = Object.entries(roleAssignmentsRaw)
    .map(([role, item]) => ({
      name: role,
      value: Number(item?.Tcode_count || 0),
    }))
    .filter((item) => item.value > 0);

  const usersByRoleCount = Object.entries(
    charts?.["Users by Role Count"] || {},
  ).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));

  const roleCategoryDistribution = Object.entries(
    charts?.["Role Category Distribution"] || {},
  ).map(([name, value]) => ({
    name,
    value: Number(value || 0),
  }));

  const roleItems = Object.entries(roleAssignmentsRaw).map(([role, item]) => ({
    role,
    count: Number(item?.user_count || 0),
  }));

  const topFiRoles = roleItems
    .filter((item) => item.role.startsWith("FI_"))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topTrmRoles = roleItems
    .filter((item) => item.role.startsWith("TRM"))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    kpis: {
      roleAssignment: {
        title: Number(kpi?.Role_Assignment?.Title || 0),
        subtitle: kpi?.Role_Assignment?.Subtitle || "",
        footer: kpi?.Role_Assignment?.Footer || "",
      },
      uniqueRoles: {
        title: Number(kpi?.Unique_Roles?.Title || 0),
        subtitle: kpi?.Unique_Roles?.Subtitle || "",
        footer: kpi?.Unique_Roles?.Footer || "",
      },
      tcodeRecords: {
        title: Number(kpi?.Tcode_Records?.Title || 0),
        subtitle: kpi?.Tcode_Records?.Subtitle || "",
        footer: kpi?.Tcode_Records?.Footer || "",
      },
      maxRoles: {
        title: Number(kpi?.Max_roles?.Title || 0),
        subtitle: kpi?.Max_roles?.Subtitle || "",
        footer: kpi?.Max_roles?.Footer || "",
      },
    },

    topRoleAssignments,
    tcodesPerRole,
    usersByRoleCount,
    roleCategoryDistribution,
    topFiRoles,
    topTrmRoles,
  };
}