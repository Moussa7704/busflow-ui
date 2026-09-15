import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const decodeToken = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return decoded;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("bf_access_token");
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser(decoded);
            } else {
                localStorage.removeItem("bf_access_token");
                localStorage.removeItem("bf_refresh_token");
            }
        }
        setLoading(false);
    }, []);

    const requestOtp = async (email, password) => {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    };

    const resendOtp = async (user_id) => {
        const response = await api.post("/auth/resend-otp", { user_id });
        return response.data;
    };

    const verifyOtp = async (user_id, code) => {
        const response = await api.post("/auth/verify-otp", { user_id, code });
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem("bf_access_token", accessToken);
        localStorage.setItem("bf_refresh_token", refreshToken);

        const decoded = decodeToken(accessToken);
        setUser(decoded);

        return decoded;
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("bf_refresh_token");
        try {
            if (refreshToken) {
                await api.post("/auth/logout", { refreshToken });
            }
        } catch {
            // on ignore une erreur de logout côté serveur
        }
        localStorage.removeItem("bf_access_token");
        localStorage.removeItem("bf_refresh_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, requestOtp, resendOtp, verifyOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
