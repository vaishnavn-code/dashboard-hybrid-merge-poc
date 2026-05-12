import { useEffect, useState } from "react";
import { dashboardApi } from "../api/client";

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await dashboardApi.getDashboard();

        if (!mounted) return;

        setData(response);
      } catch (err) {
        if (!mounted) return;

        setError(err.message || "Failed to load dashboard data");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
}