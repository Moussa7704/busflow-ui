import { useEffect, useState } from "react";
import { tripRoutesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    departure_city: "",
    arrival_city: "",
    distance_km: "",
    estimated_duration: ""
};

const RoutesPage = () => {

    const { user } = useAuth();
    const manage = can("tripRoutes", "manage", user?.role);

    const [routes, setRoutes] = useState([]);
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
            const res = await tripRoutesApi.list({ limit: 50 });
            setRoutes(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des routes.");
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
            await tripRoutesApi.create({
                ...form,
                compagny_id: form.compagny_id || undefined,
                distance_km: form.distance_km ? Number(form.distance_km) : undefined,
                estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : undefined
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
        if (!confirm("Supprimer cette route ?")) return;
        try {
            await tripRoutesApi.remove(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Suppression impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Routes</h1>
                {manage && (
                    <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                        + Nouvelle route
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Trajet</th>
                            <th className="px-4 py-2 font-medium">Distance</th>
                            <th className="px-4 py-2 font-medium">Durée estimée</th>
                            <th className="px-4 py-2 font-medium">Compagnie</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : routes.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucune route</td></tr>
                        ) : routes.map((r) => (
                            <tr key={r.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">{r.departure_city} → {r.arrival_city}</td>
                                <td className="px-4 py-2">{r.distance_km ? `${r.distance_km} km` : "-"}</td>
                                <td className="px-4 py-2">{r.estimated_duration ? `${r.estimated_duration} min` : "-"}</td>
                                <td className="px-4 py-2">{r.Compagny?.name || "-"}</td>
                                <td className="px-4 py-2 text-right">
                                    {manage && (
                                        <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouvelle route" onClose={() => setShowForm(false)}>
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
                                <label className="block text-xs font-medium text-slate-600 mb-1">Ville de départ</label>
                                <input
                                    required
                                    value={form.departure_city}
                                    onChange={(e) => setForm({ ...form, departure_city: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Ville d'arrivée</label>
                                <input
                                    required
                                    value={form.arrival_city}
                                    onChange={(e) => setForm({ ...form, arrival_city: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.distance_km}
                                    onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Durée estimée (min)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.estimated_duration}
                                    onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer la route"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default RoutesPage;
