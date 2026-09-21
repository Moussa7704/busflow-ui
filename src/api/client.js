import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("bf_access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let refreshPromise = null;

export const refreshAccessToken = async () => {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });

    localStorage.setItem("bf_access_token", response.data.accessToken);

    return response.data.accessToken;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {

        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/")
        ) {

            originalRequest._retry = true;

            try {

                if (!refreshPromise) {
                    refreshPromise = refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const newToken = await refreshPromise;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                localStorage.removeItem("bf_access_token");
                localStorage.removeItem("bf_refresh_token");
                window.location.href = "/login";

                return Promise.reject(refreshError);

            }

        }

        return Promise.reject(error);

    }
);

export default api;
