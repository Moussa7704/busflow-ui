import { useEffect, useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { CheckCircleOutlined, ToolOutlined, StopOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { busesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
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

    const { data: buses, loading, error, pagination, reload: load } = usePaginatedList(busesApi.list);
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

    const openEditForm = (bus) => {
        setEditingId(bus.id);
        setForm({
            compagny_id: bus.compagny_id || "",
            plate_number: bus.plate_number || "",
            bus_number: bus.bus_number || "",
            capacity: bus.capacity || "",
            type: bus.type || "",
            status: bus.status || "AVAILABLE"
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
                capacity: Number(form.capacity)
            };
            if (editingId) {
                await busesApi.update(editingId, payload);
                message.success("Bus mis à jour avec succès.");
            } else {
                await busesApi.create(payload);
                message.success("Bus créé avec succès.");
            }
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (bus, status) => {
        try {
            await busesApi.changeStatus(bus.id, status);
            message.success("Statut du bus mis à jour.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Changement de statut impossible.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await busesApi.remove(id);
            message.success("Bus supprimé.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Suppression impossible.");
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun bus" }}
                    columns={[
                        { title: "Immatriculation", dataIndex: "plate_number", key: "plate_number" },
                        { title: "N° interne", dataIndex: "bus_number", key: "bus_number" },
                        { title: "Capacité", dataIndex: "capacity", key: "capacity" },
                        { title: "Type", key: "type", render: (_, b) => b.type || "-" },
                        { title: "Compagnie", key: "compagny", render: (_, b) => b.Compagny?.name || "-" },
                        {
                            title: "Statut",
                            dataIndex: "status",
                            key: "status",
                            render: (status) => <StatusBadge status={status} />
                        },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, b) => manage && (
                                <Space size="small">
                                    {b.status !== "AVAILABLE" && (
                                        <Tooltip title="Marquer disponible">
                                            <Button
                                                type="text"
                                                size="small"
                                                style={{ color: "#059669" }}
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => handleStatusChange(b, "AVAILABLE")}
                                            />
                                        </Tooltip>
                                    )}
                                    {b.status !== "MAINTENANCE" && (
                                        <Tooltip title="Mettre en maintenance">
                                            <Button
                                                type="text"
                                                size="small"
                                                style={{ color: "#d97706" }}
                                                icon={<ToolOutlined />}
                                                onClick={() => handleStatusChange(b, "MAINTENANCE")}
                                            />
                                        </Tooltip>
                                    )}
                                    {b.status !== "OUT_OF_SERVICE" && (
                                        <Tooltip title="Mettre hors service">
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<StopOutlined />}
                                                onClick={() => handleStatusChange(b, "OUT_OF_SERVICE")}
                                            />
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Modifier">
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(b)} />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Supprimer ce bus ?"
                                        onConfirm={() => handleDelete(b.id)}
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
                    dataSource={buses}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier le bus" : "Nouveau bus"} onClose={() => setShowForm(false)}>
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
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer le bus"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default BusesPage;
