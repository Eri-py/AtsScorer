import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = "https://localhost:7000/api";
const API_ORIGIN = new URL(API_BASE_URL).origin;

export function resolveApiUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith("/api/")) {
    return `${API_ORIGIN}${pathOrUrl}`;
  }

  if (pathOrUrl.startsWith("api/")) {
    return `${API_ORIGIN}/${pathOrUrl}`;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}/${pathOrUrl.replace(/^\//, "")}`;
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
const failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] =
  [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue.length = 0;
};

const getNewAccessToken = () => {
  return axiosInstance.post("auth/refresh-token");
};

type CustomAxiosRequestConfig = { _retry?: boolean } & InternalAxiosRequestConfig;

axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config as CustomAxiosRequestConfig;

  if (error.response?.status !== 401) {
    return Promise.reject(error);
  }

  if (originalRequest.url?.includes("auth/refresh-token")) {
    return Promise.reject(error);
  }

  if (originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then(() => axiosInstance.request(originalRequest))
      .catch((err) => Promise.reject(err));
  }

  isRefreshing = true;
  try {
    await getNewAccessToken();
    processQueue();
    return axiosInstance.request(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
});
