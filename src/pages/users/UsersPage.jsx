import { useEffect, useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { CheckCircleOutlined, StopOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { usersApi, rolesApi, agenciesApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
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

    const { data: users, loading, error, pagination, reload: load } = usePaginatedList(usersApi.list);
    const [roles, setRoles] = useState([]);
    const [agencies, setAgencies] = useState([]);
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

    const openForm = async () => {
        setEditingId(null);
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

    const openEditForm = async (u) => {
        setEditingId(u.id);
        setForm({
            compagny_id: u.compagny_id || "",
            agency_id: u.agency_id || "",
            role_id: u.role_id || "",
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            phone: u.phone || "",
            email: u.email || "",
            password: ""
        });
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
            const payload = {
                ...form,
                compagny_id: form.compagny_id || undefined,
                agency_id: form.agency_id || undefined
            };
            if (editingId) {
                if (!payload.password) delete payload.password;
                await usersApi.update(editingId, payload);
                message.success("Utilisateur mis à jour avec succès.");
            } else {
                await usersApi.create(payload);
                message.success("Utilisateur créé avec succès.");
            }
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await usersApi.changeStatus(id);
            message.success("Statut de l'utilisateur mis à jour.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Action impossible.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await usersApi.remove(id);
            message.success("Utilisateur supprimé.");
            load();
        } catch (err) {
            message.error(err.response?.data?.message || "Suppression impossible.");
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun utilisateur" }}
                    columns={[
                        { title: "Nom", key: "name", render: (_, u) => `${u.first_name} ${u.last_name}` },
                        { title: "Email", dataIndex: "email", key: "email" },
                        { title: "Téléphone", dataIndex: "phone", key: "phone" },
                        { title: "Rôle", key: "role", render: (_, u) => u.Role?.name || "-" },
                        { title: "Agence", key: "agency", render: (_, u) => u.Agency?.name || "-" },
                        {
                            title: "Statut",
                            key: "is_active",
                            render: (_, u) => (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                    {u.is_active ? "ACTIF" : "INACTIF"}
                                </span>
                            )
                        },
                        {
                            title: "",
                            key: "actions",
                            align: "right",
                            render: (_, u) => manage && (
                                <Space size="small">
                                    <Tooltip title={u.is_active ? "Désactiver" : "Activer"}>
                                        <Button
                                            type="text"
                                            size="small"
                                            style={u.is_active ? undefined : { color: "#059669" }}
                                            icon={u.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                                            onClick={() => handleToggleStatus(u.id)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Modifier">
                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(u)} />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Supprimer cet utilisateur ?"
                                        onConfirm={() => handleDelete(u.id)}
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
                    dataSource={users}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier l'utilisateur" : "Nouvel utilisateur"} onClose={() => setShowForm(false)}>
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
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Mot de passe {editingId && "(laisser vide pour ne pas changer)"}
                            </label>
                            <input
                                type="password"
                                required={!editingId}
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
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default UsersPage;
