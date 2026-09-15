import { useEffect, useState } from "react";
import { usersApi, rolesApi, agenciesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    agency_id: "",
    role_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: ""
};

const UsersPage = () => {

    const { user } = useAuth();
    const manage = can("users", "manage", user?.role);

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [compagnies, setCompagnies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await usersApi.list({ limit: 50 });
            setUsers(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des utilisateurs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        if (isSuperAdmin(user?.role)) {
            compagniesApi.list({ limit: 100 }).then((res) => setCompagnies(res.data)).catch(() => {});
        }
    }, []);

    const openForm = async () => {
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
        try {
            const [rolesRes, agenciesRes] = await Promise.all([
                rolesApi.list(),
                agenciesApi.list({ limit: 100 })
            ]);
            setRoles(rolesRes.data);
            setAgencies(agenciesRes.data);
        } catch {
            setRoles([]);
            setAgencies([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            await usersApi.create({
                ...form,
                compagny_id: form.compagny_id || undefined,
                agency_id: form.agency_id || undefined
            });
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await usersApi.changeStatus(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Action impossible.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer cet utilisateur ?")) return;
        try {
            await usersApi.remove(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Suppression impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Utilisateurs</h1>
                {manage && (
                    <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                        + Nouvel utilisateur
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Nom</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Téléphone</th>
                            <th className="px-4 py-2 font-medium">Rôle</th>
                            <th className="px-4 py-2 font-medium">Agence</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun utilisateur</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">{u.first_name} {u.last_name}</td>
                                <td className="px-4 py-2">{u.email}</td>
                                <td className="px-4 py-2">{u.phone}</td>
                                <td className="px-4 py-2">{u.Role?.name || "-"}</td>
                                <td className="px-4 py-2">{u.Agency?.name || "-"}</td>
                                <td className="px-4 py-2">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                        {u.is_active ? "ACTIF" : "INACTIF"}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right space-x-2">
                                    {manage && (
                                        <>
                                            <button onClick={() => handleToggleStatus(u.id)} className="text-xs text-blue-600 hover:underline">
                                                {u.is_active ? "Désactiver" : "Activer"}
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouvel utilisateur" onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {formError && <div className="text-sm text-red-600">{formError}</div>}

                        {isSuperAdmin(user?.role) && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Compagnie</label>
                                <select
                                    required
                                    value={form.compagny_id}
                                    onChange={(e) => setForm({ ...form, compagny_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {compagnies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

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

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rôle</label>
                                <select
                                    required
                                    value={form.role_id}
                                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Agence (optionnel)</label>
                                <select
                                    value={form.agency_id}
                                    onChange={(e) => setForm({ ...form, agency_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Aucune</option>
                                    {agencies.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer l'utilisateur"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default UsersPage;
