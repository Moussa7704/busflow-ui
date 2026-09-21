import { useEffect, useState } from "react";
import { Table, Button, Tooltip, message } from "antd";
import { EditOutlined, LoadingOutlined } from "@ant-design/icons";
import { passengersApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    identity_number: ""
};

const PassengersPage = () => {

    const { user } = useAuth();
    const manage = can("passengers", "manage", user?.role);

    const { data: passengers, loading, error, pagination, reload: load } = usePaginatedList(passengersApi.list);
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

    const openEditForm = (passenger) => {
        setEditingId(passenger.id);
        setForm({
            compagny_id: passenger.compagny_id || "",
            first_name: passenger.first_name || "",
            last_name: passenger.last_name || "",
            phone: passenger.phone || "",
            email: passenger.email || "",
            identity_number: passenger.identity_number || ""
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
                compagny_id: form.compagny_id || undefined
            };
            if (editingId) {
                await passengersApi.update(editingId, payload);
                message.success("Passager mis à jour avec succès.");
            } else {
                await passengersApi.create(payload);
                message.success("Passager créé avec succès.");
            }
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Passagers</h1>
                {manage && (
                    <button onClick={openForm} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800">
                        + Nouveau passager
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun passager" }}
                    columns={[
                        { title: "Nom", key: "name", render: (_, p) => `${p.first_name} ${p.last_name}` },
                        { title: "Téléphone", dataIndex: "phone", key: "phone" },
                        { title: "Email", key: "email", render: (_, p) => p.email || "-" },
                        { title: "Pièce d'identité", key: "identity_number", render: (_, p) => p.identity_number || "-" },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, p) => manage && (
                                <Tooltip title="Modifier">
                                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(p)} />
                                </Tooltip>
                            )
                        }
                    ]}
                    dataSource={passengers}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier le passager" : "Nouveau passager"} onClose={() => setShowForm(false)}>
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
                                <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                                <input
                                    required
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Email (optionnel)</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Pièce d'identité (optionnel)</label>
                            <input
                                value={form.identity_number}
                                onChange={(e) => setForm({ ...form, identity_number: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer le passager"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default PassengersPage;
