import { useParams, Navigate } from "react-router-dom";
import { DASHBOARD_ROUTES } from "./dashboardRoutes";

export default function DashboardRouteRenderer() {
  const { dashboardKey } = useParams();

  const dashboard = DASHBOARD_ROUTES[dashboardKey];

  if (!dashboardKey) {
    return <Navigate to="/dashboard/base" replace />;
  }

  if (!dashboard || !dashboard.component) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard not found</h2>
        <p>No dashboard configured for: {dashboardKey}</p>
      </div>
    );
  }

  const DashboardComponent = dashboard.component;

  return <DashboardComponent />;
}