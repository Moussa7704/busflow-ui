import { useEffect, useState } from "react";
import { busesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    plate_number: "",
    bus_number: "",
    capacity: "",
    type: "",
    status: "AVAILABLE"
};

const BusesPage = () => {

    const { user } = useAuth();
    const manage = can("buses", "manage", user?.role);

    const [buses, setBuses] = useState([]);
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
            const res = await busesApi.list({ limit: 50 });
            setBuses(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des bus.");
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
            await busesApi.create({
                ...form,
                compagny_id: form.compagny_id || undefined,
                capacity: Number(form.capacity)
            });
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (bus, status) => {
        try {
            await busesApi.changeStatus(bus.id, status);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Changement de statut impossible.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce bus ?")) return;
        try {
            await busesApi.remove(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Suppression impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Bus</h1>
                {manage && (
                    <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                        + Nouveau bus
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Immatriculation</th>
                            <th className="px-4 py-2 font-medium">N° interne</th>
                            <th className="px-4 py-2 font-medium">Capacité</th>
                            <th className="px-4 py-2 font-medium">Type</th>
                            <th className="px-4 py-2 font-medium">Compagnie</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : buses.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucun bus</td></tr>
                        ) : buses.map((b) => (
                            <tr key={b.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">{b.plate_number}</td>
                                <td className="px-4 py-2">{b.bus_number}</td>
                                <td className="px-4 py-2">{b.capacity}</td>
                                <td className="px-4 py-2">{b.type || "-"}</td>
                                <td className="px-4 py-2">{b.Compagny?.name || "-"}</td>
                                <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                                <td className="px-4 py-2 text-right space-x-2">
                                    {manage && (
                                        <>
                                            {b.status !== "AVAILABLE" && (
                                                <button onClick={() => handleStatusChange(b, "AVAILABLE")} className="text-xs text-emerald-600 hover:underline">Disponible</button>
                                            )}
                                            {b.status !== "MAINTENANCE" && (
                                                <button onClick={() => handleStatusChange(b, "MAINTENANCE")} className="text-xs text-amber-600 hover:underline">Maintenance</button>
                                            )}
                                            <button onClick={() => handleDelete(b.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouveau bus" onClose={() => setShowForm(false)}>
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
                                <label className="block text-xs font-medium text-slate-600 mb-1">Immatriculation</label>
                                <input
                                    required
                                    value={form.plate_number}
                                    onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">N° interne</label>
                                <input
                                    value={form.bus_number}
                                    onChange={(e) => setForm({ ...form, bus_number: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Capacité</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={form.capacity}
                                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                                <input
                                    placeholder="MINIBUS, VIP..."
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer le bus"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default BusesPage;
