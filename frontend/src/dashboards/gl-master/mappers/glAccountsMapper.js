export function mapGlAccounts(raw) {
  const table = raw?.gl_accounts?.table ?? [];

  return {
    table: Array.isArray(table) ? table : [],
  };
}

export function getGlAccountRange(glAccount) {
  const firstDigit = String(glAccount || "").trim().charAt(0);

  if (!firstDigit) return "Unknown";

  return `${firstDigit}xxxxxxx`;
}

export function getGlAccountStatus(row) {
  const blocked =
    String(row?.blk_post || "").toLowerCase() === "yes" ||
    String(row?.blk_cocode || "").toLowerCase() === "yes" ||
    String(row?.mrk_del || "").toLowerCase() === "yes" ||
    String(row?.status || "").toLowerCase() === "blocked";

  return blocked ? "Blocked" : "Active";
}