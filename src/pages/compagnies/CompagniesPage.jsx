import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined, PauseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { compagniesApi } from "../../api/resources";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    name: "",
    telephone: "",
    email: "",
    adresse: ""
};

const CompagniesPage = () => {

    const { data: compagnies, loading, error, pagination, reload: load } = usePaginatedList(compagniesApi.list);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const openForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
    };

    const openEditForm = (compagny) => {
        setEditingId(compagny.id);
        setForm({
            name: compagny.name || "",
            telephone: compagny.telephone || "",
            email: compagny.email || "",
            adresse: compagny.adresse || ""
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
                await compagniesApi.update(editingId, form);
                message.success("Compagnie mise à jour avec succès.");
            } else {
                await compagniesApi.create(form);
                message.success("Compagnie créée avec succès.");
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
            await compagniesApi.remove(id);
            message.success("Compagnie supprimée.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Suppression impossible.");
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await compagniesApi.update(id, { status });
            message.success("Statut de la compagnie mis à jour.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Changement de statut impossible.");
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucune compagnie" }}
                    columns={[
                        { title: "Nom", dataIndex: "name", key: "name" },
                        { title: "Téléphone", key: "telephone", render: (_, c) => c.telephone || "-" },
                        { title: "Email", key: "email", render: (_, c) => c.email || "-" },
                        { title: "Adresse", key: "adresse", render: (_, c) => c.adresse || "-" },
                        { title: "Statut", key: "status", render: (_, c) => c.status ? <StatusBadge status={c.status} /> : "-" },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, c) => (
                                <Space size="small">
                                    {c.status !== "ACTIVE" && (
                                        <Tooltip title="Activer">
                                            <Button
                                                type="text"
                                                size="small"
                                                style={{ color: "#059669" }}
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => handleStatusChange(c.id, "ACTIVE")}
                                            />
                                        </Tooltip>
                                    )}
                                    {c.status !== "SUSPENDED" && (
                                        <Tooltip title="Suspendre">
                                            <Button
                                                type="text"
                                                size="small"
                                                style={{ color: "#d97706" }}
                                                icon={<PauseCircleOutlined />}
                                                onClick={() => handleStatusChange(c.id, "SUSPENDED")}
                                            />
                                        </Tooltip>
                                    )}
                                    {c.status !== "INACTIVE" && (
                                        <Tooltip title="Désactiver">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<StopOutlined />}
                                                onClick={() => handleStatusChange(c.id, "INACTIVE")}
                                            />
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Modifier">
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(c)} />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Supprimer cette compagnie ?"
                                        onConfirm={() => handleDelete(c.id)}
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
                    dataSource={compagnies}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier la compagnie" : "Nouvelle compagnie"} onClose={() => setShowForm(false)}>
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
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer la compagnie"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default CompagniesPage;
