import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";

const Login = () => {

    const { requestOtp, resendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState("");

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await requestOtp(email, password);
            setUserId(data.user_id);
            setStep("otp");
            setInfo(`Code envoyé à ${data.email}`);
        } catch (err) {
            setError(err.response?.data?.message || "Échec de connexion.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await verifyOtp(userId, code);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Code invalide.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setInfo("");
        try {
            await resendOtp(userId);
            setInfo("Nouveau code envoyé.");
        } catch (err) {
            setError(err.response?.data?.message || "Échec de l'envoi.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">

                <h1 className="text-xl font-semibold text-slate-900 mb-1">BusFlow Admin</h1>
                <p className="text-sm text-slate-500 mb-6">
                    {step === "credentials" ? "Connectez-vous à votre espace" : "Vérification en deux étapes"}
                </p>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                        {error}
                    </div>
                )}

                {info && !error && (
                    <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-2">
                        {info}
                    </div>
                )}

                {step === "credentials" ? (
                    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="admin@busflow.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading && <LoadingOutlined />}
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Code à 6 chiffres</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium py-2 hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading && <LoadingOutlined />}
                            {loading ? "Vérification..." : "Valider"}
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            className="w-full text-sm text-slate-500 hover:text-slate-800"
                        >
                            Renvoyer le code
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default Login;
