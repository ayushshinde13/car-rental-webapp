import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // important for auth/session safety
});

// ----------------------------
// Request Interceptor
// ----------------------------
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Attach token if exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set JSON content-type when data is not FormData
    if (config.data && typeof FormData !== "undefined" && config.data instanceof FormData) {
      // Let the browser set the correct multipart boundary
      delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------
// Response Interceptor
// ----------------------------
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout on unauthorized
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized – logging out");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
    }
    return Promise.reject(error);
  }
);

export default instance;
