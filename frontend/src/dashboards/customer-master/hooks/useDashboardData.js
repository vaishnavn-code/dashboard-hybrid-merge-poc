import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "../api/client";
import axios from "axios";

const api = axios.create({
  baseURL: "https://fs-customer-analytics.azurewebsites.net/api",
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await dashboardApi.getDashboard();

      setData(response);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * useInsights — fetch AI insights on demand.
 * Same structure as borrowings.
 */

async function getInsightsContext(sessionId, token) {
  const res = await api.post(
    "/data/ai",
    {
      session_id: sessionId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}

async function generateInsights(context) {
  const res = await fetch(
    "https://development.fsnxt.com/fsnxtbackend/api/insights-cm.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(context),
    }
  );

  if (!res.ok) {
    throw new Error("Insights API failed");
  }

  return res.json();
}

const insightsCache = {
  key: null,
  insights: null,
  hasGenerated: false,
  loading: false,
  error: null,
  promise: null,
};

const insightsListeners = new Set();

function getInsightsAuth() {
  const params = new URLSearchParams(window.location.search);

  return {
    sessionId: params.get("session_id"),
    token: params.get("token"),
  };
}

function hydrateInsightsCache(sessionId) {
  const key = sessionId || null;

  if (insightsCache.key === key) return;

  insightsCache.key = key;
  insightsCache.insights = null;
  insightsCache.hasGenerated = false;
  insightsCache.loading = false;
  insightsCache.error = null;
  insightsCache.promise = null;
}

function getInsightsSnapshot() {
  return {
    insights: insightsCache.insights,
    hasGenerated: insightsCache.hasGenerated,
    loading: insightsCache.loading,
    error: insightsCache.error,
  };
}

function publishInsightsSnapshot() {
  const snapshot = getInsightsSnapshot();
  insightsListeners.forEach((listener) => listener(snapshot));
}

export function useInsights() {
  const [state, setState] = useState(() => {
    const { sessionId } = getInsightsAuth();
    hydrateInsightsCache(sessionId);

    return getInsightsSnapshot();
  });

  useEffect(() => {
    const { sessionId } = getInsightsAuth();
    hydrateInsightsCache(sessionId);

    setState(getInsightsSnapshot());

    insightsListeners.add(setState);

    return () => {
      insightsListeners.delete(setState);
    };
  }, []);

  const generate = useCallback(async () => {
    const { sessionId, token } = getInsightsAuth();

    hydrateInsightsCache(sessionId);

    if (!sessionId || !token) {
      insightsCache.loading = false;
      insightsCache.error = "Missing session or token";
      publishInsightsSnapshot();
      return;
    }

    insightsCache.loading = true;
    insightsCache.error = null;
    publishInsightsSnapshot();

    const promise = (async () => {
      const context = await getInsightsContext(sessionId, token);
      return generateInsights(context);
    })();

    insightsCache.promise = promise;

    try {
      const result = await promise;

      if (insightsCache.promise === promise) {
        insightsCache.insights = result;
        insightsCache.hasGenerated = true;
        insightsCache.loading = false;
        insightsCache.error = null;
        insightsCache.promise = null;

        publishInsightsSnapshot();
      }

      return result;
    } catch (err) {
      if (insightsCache.promise === promise) {
        insightsCache.loading = false;
        insightsCache.error = err.message || "Failed to generate insights";
        insightsCache.promise = null;

        publishInsightsSnapshot();
      }
    }
  }, []);

  return {
    insights: state.insights,
    loading: state.loading,
    error: state.error,
    generate,
    hasGenerated: state.hasGenerated,
  };
}