import axios, { AxiosError } from "axios";

const API_BASE_URL = "https://localhost:7000/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Will be wired up once the refresh-token endpoint is implemented
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config;

  // Don't intercept refresh-token requests (prevents deadlock)
  const isRefreshRequest = originalRequest?.url?.includes("auth/refresh-token");

  if (error.response?.status === 401 && originalRequest && !isRefreshRequest) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance.request(originalRequest));
    }

    isRefreshing = true;
    try {
      await axiosInstance.post("/auth/refresh-token");
      processQueue(null);
      return axiosInstance.request(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
});
