import BaseDashboard from "./BaseDashboard";
import BorrowingsDashboard from "../dashboards/borrowings";
import NiExposureDashboard from "../dashboards/ni-exposure";
import UserDashboard from "../dashboards/user-dashboard";
import CustomerMasterDashboard from "../dashboards/customer-master";
import VendorMasterDashboard from "../dashboards/vendor-master";
import GlMasterDashboard from "../dashboards/gl-master";

export const DASHBOARD_ROUTES = {
  base: {
    title: "Base Dashboard",
    type: "base",
    component: BaseDashboard,
  },

  borrowings: {
    title: "Borrowings Dashboard",
    type: "legacy",
    component: BorrowingsDashboard,
  },

  "ni-exposure": {
    title: "NI Exposure Dashboard",
    type: "legacy",
    component: NiExposureDashboard,
  },

  "user-dashboard": {
    title: "User Governance Dashboard",
    type: "legacy",
    component: UserDashboard,
  },

  "customer-master": {
    title: "Customer Master Dashboard",
    type: "config-driven",
    component: CustomerMasterDashboard,
  },

  "vendor-master": {
    title: "Vendor Master Dashboard",
    type: "config-driven",
    component: VendorMasterDashboard,
  },
  "gl-master": {
    title: "GL Master Dashboard",
    type: "config-driven",
    component: GlMasterDashboard,
  },
};
