import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardRouteRenderer from "./app/DashboardRouteRenderer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/base" replace />} />
        <Route path="/dashboard/:dashboardKey" element={<DashboardRouteRenderer />} />
        <Route path="*" element={<Navigate to="/dashboard/base" replace />} />
      </Routes>
    </BrowserRouter>
  );
}