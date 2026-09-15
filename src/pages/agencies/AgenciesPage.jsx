import { useEffect, useState } from "react";
import { agenciesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    name: "",
    city: "",
    address: "",
    phone: ""
};

const AgenciesPage = () => {

    const { user } = useAuth();
    const manage = can("agencies", "manage", user?.role);

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
            const res = await agenciesApi.list({ limit: 50 });
            setAgencies(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des agences.");
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

    const openForm = () => {
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            await agenciesApi.create({
                ...form,
                compagny_id: form.compagny_id || undefined
            });
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer cette agence ?")) return;
        try {
            await agenciesApi.remove(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Suppression impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Agences</h1>
                {manage && (
                    <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                        + Nouvelle agence
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Nom</th>
                            <th className="px-4 py-2 font-medium">Ville</th>
                            <th className="px-4 py-2 font-medium">Adresse</th>
                            <th className="px-4 py-2 font-medium">Téléphone</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : agencies.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucune agence</td></tr>
                        ) : agencies.map((a) => (
                            <tr key={a.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">{a.name}</td>
                                <td className="px-4 py-2">{a.city}</td>
                                <td className="px-4 py-2">{a.address || "-"}</td>
                                <td className="px-4 py-2">{a.phone || "-"}</td>
                                <td className="px-4 py-2 text-right">
                                    {manage && (
                                        <button onClick={() => handleDelete(a.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouvelle agence" onClose={() => setShowForm(false)}>
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

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Ville</label>
                                <input
                                    required
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
                            <input
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer l'agence"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default AgenciesPage;
