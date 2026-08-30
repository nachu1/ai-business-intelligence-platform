import axios from "axios";

const api = axios.create({
  baseURL: "http://172.20.10.4:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;

let refreshQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

function processQueue(
  error: any,
  token: string | null = null
) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve,
          reject,
        });
      }).then((token) => {
        originalRequest.headers.Authorization =
          `Bearer ${token}`;

        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        "http://172.20.10.4:8000/auth/refresh",
        {},
        {
          withCredentials: true,
        }
      );

      const newToken =
        response.data.access_token;

      localStorage.setItem(
        "access_token",
        newToken
      );

      processQueue(null, newToken);

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError);

      localStorage.removeItem(
        "access_token"
      );

      window.location.href = "/login";

      return Promise.reject(
        refreshError
      );

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;