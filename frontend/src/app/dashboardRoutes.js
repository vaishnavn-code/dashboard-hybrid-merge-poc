import BaseDashboard from "./BaseDashboard";
import BorrowingsDashboard from "../dashboards/borrowings";
import NiExposureDashboard from "../dashboards/ni-exposure";
import UserDashboard from "../dashboards/user-dashboard";

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
    title: "User Dashboard",
    type: "legacy",
    component: UserDashboard,
  },
};