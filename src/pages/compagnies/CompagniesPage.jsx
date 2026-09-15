import { useEffect, useState } from "react";
import { compagniesApi } from "../../api/resources";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    name: "",
    telephone: "",
    email: "",
    adresse: ""
};

const CompagniesPage = () => {

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
            const res = await compagniesApi.list({ limit: 50 });
            setCompagnies(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des compagnies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
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
            await compagniesApi.create(form);
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer cette compagnie ?")) return;
        try {
            await compagniesApi.remove(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || "Suppression impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Compagnies</h1>
                <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                    + Nouvelle compagnie
                </button>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Nom</th>
                            <th className="px-4 py-2 font-medium">Téléphone</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Adresse</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : compagnies.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aucune compagnie</td></tr>
                        ) : compagnies.map((c) => (
                            <tr key={c.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">{c.name}</td>
                                <td className="px-4 py-2">{c.telephone || "-"}</td>
                                <td className="px-4 py-2">{c.email || "-"}</td>
                                <td className="px-4 py-2">{c.adresse || "-"}</td>
                                <td className="px-4 py-2">{c.status ? <StatusBadge status={c.status} /> : "-"}</td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouvelle compagnie" onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {formError && <div className="text-sm text-red-600">{formError}</div>}

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
                                <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                                <input
                                    value={form.telephone}
                                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Adresse</label>
                            <input
                                value={form.adresse}
                                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer la compagnie"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default CompagniesPage;
