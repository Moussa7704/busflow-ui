import { useEffect, useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { agenciesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
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

    const { data: agencies, loading, error, pagination, reload: load } = usePaginatedList(agenciesApi.list);
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

    const openEditForm = (agency) => {
        setEditingId(agency.id);
        setForm({
            compagny_id: agency.compagny_id || "",
            name: agency.name || "",
            city: agency.city || "",
            address: agency.address || "",
            phone: agency.phone || ""
        });
        setFormError("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            if (editingId) {
                await agenciesApi.update(editingId, {
                    ...form,
                    compagny_id: form.compagny_id || undefined
                });
                message.success("Agence mise à jour avec succès.");
            } else {
                await agenciesApi.create({
                    ...form,
                    compagny_id: form.compagny_id || undefined
                });
                message.success("Agence créée avec succès.");
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
            await agenciesApi.remove(id);
            message.success("Agence supprimée.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Suppression impossible.");
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucune agence" }}
                    columns={[
                        { title: "Nom", dataIndex: "name", key: "name" },
                        { title: "Ville", dataIndex: "city", key: "city" },
                        { title: "Adresse", key: "address", render: (_, a) => a.address || "-" },
                        { title: "Téléphone", key: "phone", render: (_, a) => a.phone || "-" },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, a) => manage && (
                                <Space size="small">
                                    <Tooltip title="Modifier">
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(a)} />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Supprimer cette agence ?"
                                        onConfirm={() => handleDelete(a.id)}
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
                    dataSource={agencies}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier l'agence" : "Nouvelle agence"} onClose={() => setShowForm(false)}>
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
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer l'agence"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default AgenciesPage;
