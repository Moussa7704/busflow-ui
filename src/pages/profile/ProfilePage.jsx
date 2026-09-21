import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { profileApi } from "../../api/resources";

const ProfilePage = () => {

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "" });
    const [formError, setFormError] = useState("");
    const [savingInfo, setSavingInfo] = useState(false);

    const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const [passwordError, setPasswordError] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await profileApi.get();
            setProfile(res.data);
            setForm({
                first_name: res.data.first_name || "",
                last_name: res.data.last_name || "",
                phone: res.data.phone || "",
                email: res.data.email || ""
            });
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement du profil.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSavingInfo(true);
        try {
            const res = await profileApi.update(form);
            setProfile(res.data);
            message.success("Profil mis à jour avec succès.");
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la mise à jour.");
        } finally {
            setSavingInfo(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError("");

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        setSavingPassword(true);
        try {
            await profileApi.changePassword({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password
            });
            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
            message.success("Mot de passe modifié avec succès.");
        } catch (err) {
            setPasswordError(err.response?.data?.message || "Erreur lors du changement de mot de passe.");
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <div className="text-sm text-red-600">{error}</div>;
    }

    return (
        <div className="max-w-2xl space-y-6">

            <h1 className="text-lg font-semibold text-slate-900">Mon profil</h1>

            <div className="bg-white rounded-lg border border-slate-200 p-5">

                <h2 className="text-sm font-medium text-slate-700 mb-1">Informations du compte</h2>
                <p className="text-xs text-slate-500 mb-4">
                    Rôle : <span className="font-medium text-slate-700">{profile?.Role?.name}</span>
                    {profile?.Compagny && <> — Compagnie : <span className="font-medium text-slate-700">{profile.Compagny.name}</span></>}
                    {profile?.Agency && <> — Agence : <span className="font-medium text-slate-700">{profile.Agency.name}</span></>}
                </p>

                <form onSubmit={handleInfoSubmit} className="space-y-3">

                    {formError && <div className="text-sm text-red-600">{formError}</div>}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Prénom</label>
                            <input
                                required
                                value={form.first_name}
                                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                            <input
                                required
                                value={form.last_name}
                                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                            <input
                                required
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingInfo}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                    >
                        {savingInfo && <LoadingOutlined />}
                        {savingInfo ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">

                <h2 className="text-sm font-medium text-slate-700 mb-4">Changer le mot de passe</h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-3">

                    {passwordError && <div className="text-sm text-red-600">{passwordError}</div>}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe actuel</label>
                        <input
                            type="password"
                            required
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordForm.confirm_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                    >
                        {savingPassword && <LoadingOutlined />}
                        {savingPassword ? "Modification..." : "Changer le mot de passe"}
                    </button>
                </form>
            </div>

        </div>
    );

};

export default ProfilePage;
