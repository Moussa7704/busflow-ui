import { useEffect, useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { tripRoutesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
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

    const { data: routes, loading, error, pagination, reload: load } = usePaginatedList(tripRoutesApi.list);
    const [compagnies, setCompagnies] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isSuperAdmin(user?.role)) {
            compagniesApi.list({ limit: 100 }).then((res) => setCompagnies(res.data.filter((c) => c.status === "ACTIVE"))).catch(() => {});
        }
    }, []);

    const openForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
    };

    const openEditForm = (route) => {
        setEditingId(route.id);
        setForm({
            compagny_id: route.compagny_id || "",
            departure_city: route.departure_city || "",
            arrival_city: route.arrival_city || "",
            distance_km: route.distance_km || "",
            estimated_duration: route.estimated_duration || ""
        });
        setFormError("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                compagny_id: form.compagny_id || undefined,
                distance_km: form.distance_km ? Number(form.distance_km) : undefined,
                estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : undefined
            };
            if (editingId) {
                await tripRoutesApi.update(editingId, payload);
                message.success("Route mise à jour avec succès.");
            } else {
                await tripRoutesApi.create(payload);
                message.success("Route créée avec succès.");
            }
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await tripRoutesApi.remove(id);
            message.success("Route supprimée.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Suppression impossible.");
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucune route" }}
                    columns={[
                        { title: "Trajet", key: "trajet", render: (_, r) => `${r.departure_city} → ${r.arrival_city}` },
                        { title: "Distance", key: "distance_km", render: (_, r) => r.distance_km ? `${r.distance_km} km` : "-" },
                        { title: "Durée estimée", key: "estimated_duration", render: (_, r) => r.estimated_duration ? `${r.estimated_duration} min` : "-" },
                        { title: "Compagnie", key: "compagny", render: (_, r) => r.Compagny?.name || "-" },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, r) => manage && (
                                <Space size="small">
                                    <Tooltip title="Modifier">
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(r)} />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Supprimer cette route ?"
                                        onConfirm={() => handleDelete(r.id)}
                                        okText="Oui"
                                        cancelText="Non"
                                    >
                                        <Tooltip title="Supprimer">
                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                        </Tooltip>
                                    </Popconfirm>
                                </Space>
                            )
                        }
                    ]}
                    dataSource={routes}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier la route" : "Nouvelle route"} onClose={() => setShowForm(false)}>
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
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer la route"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default RoutesPage;
