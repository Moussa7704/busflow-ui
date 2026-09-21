import { createContext, useContext, useEffect, useState } from "react";
import api, { refreshAccessToken } from "../api/client";

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
        const init = async () => {
            const token = localStorage.getItem("bf_access_token");
            const decoded = token ? decodeToken(token) : null;

            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser(decoded);
                setLoading(false);
                return;
            }

            // Token absent ou expiré : on tente un rafraîchissement silencieux
            // via le cookie httpOnly avant de considérer l'utilisateur déconnecté.
            try {
                const newToken = await refreshAccessToken();
                setUser(decodeToken(newToken));
            } catch {
                localStorage.removeItem("bf_access_token");
            } finally {
                setLoading(false);
            }
        };

        init();
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
        const { accessToken } = response.data;

        localStorage.setItem("bf_access_token", accessToken);

        const decoded = decodeToken(accessToken);
        setUser(decoded);

        return decoded;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // on ignore une erreur de logout côté serveur
        }
        localStorage.removeItem("bf_access_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, requestOtp, resendOtp, verifyOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);
