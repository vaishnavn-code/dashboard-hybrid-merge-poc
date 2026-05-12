import axios from "axios";

const api = axios.create({
  baseURL: "https://fs-customer-analytics.azurewebsites.net/api",
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      "API error";

    return Promise.reject(new Error(msg));
  }
);

export const dashboardApi = {
  getDashboard: async () => {
    const params = new URLSearchParams(window.location.search);

    const sessionId = params.get("session_id");
    const token = params.get("token");

    if (!sessionId || !token) {
      throw new Error("Missing session_id or token in URL");
    }

    return api.post(
      "/data/query",
      {
        // IMPORTANT:
        // If backend expects different query_type, change only this value.
        query_type: "customer_master_dashboard",
        session_id: sessionId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

export default api;