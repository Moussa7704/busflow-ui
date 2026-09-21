import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, message } from "antd";
import { ArrowRightOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { courriersApi, agenciesApi, tripsApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const nextStatus = {
    REGISTERED: "IN_TRANSIT",
    IN_TRANSIT: "ARRIVED",
    ARRIVED: "DELIVERED"
};

const emptyForm = {
    sender_name: "",
    sender_phone: "",
    receiver_name: "",
    receiver_phone: "",
    description: "",
    quantity: 1,
    weight: "",
    departure_agency_id: "",
    arrival_agency_id: "",
    trip_id: "",
    price: "",
    payment_method: "CASH"
};

const CourriersPage = () => {

    const { user } = useAuth();
    const manage = can("courriers", "manage", user?.role);

    const { data: courriers, loading, error, pagination, reload } = usePaginatedList(courriersApi.list);
    const [agencies, setAgencies] = useState([]);
    const [trips, setTrips] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [trackingQuery, setTrackingQuery] = useState("");
    const [trackingResult, setTrackingResult] = useState(null);
    const [trackingError, setTrackingError] = useState("");

    const [deliverCourrier, setDeliverCourrier] = useState(null);
    const [identityNumber, setIdentityNumber] = useState("");
    const [deliverError, setDeliverError] = useState("");
    const [delivering, setDelivering] = useState(false);

    const openForm = async () => {
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
        try {
            const [agenciesRes, tripsRes] = await Promise.all([
                agenciesApi.list({ limit: 100 }),
                tripsApi.list({ limit: 100 })
            ]);
            setAgencies(agenciesRes.data);
            setTrips(tripsRes.data.filter((t) => t.status === "SCHEDULED" || t.status === "BOARDING"));
        } catch {
            setAgencies([]);
            setTrips([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            await courriersApi.create({
                ...form,
                quantity: Number(form.quantity),
                weight: Number(form.weight),
                price: Number(form.price)
            });
            setShowForm(false);
            message.success("Courrier enregistré avec succès.");
            reload();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdvance = async (courrier) => {
        const status = nextStatus[courrier.status];
        if (!status) return;

        if (status === "DELIVERED") {
            setDeliverCourrier(courrier);
            setIdentityNumber("");
            setDeliverError("");
            return;
        }

        try {
            await courriersApi.changeStatus(courrier.id, status);
            message.success("Statut du courrier mis à jour.");
            reload();
        } catch (err) {
            message.error(err.response?.data?.message || "Transition impossible.");
        }
    };

    const handleDeliverSubmit = async (e) => {
        e.preventDefault();
        setDeliverError("");
        setDelivering(true);
        try {
            await courriersApi.changeStatus(deliverCourrier.id, "DELIVERED", { receiver_identity_number: identityNumber });
            message.success("Retrait confirmé avec succès.");
            setDeliverCourrier(null);
            reload();
        } catch (err) {
            setDeliverError(err.response?.data?.message || "Erreur lors de la confirmation du retrait.");
        } finally {
            setDelivering(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            await courriersApi.cancel(id);
            message.success("Courrier annulé.");
            reload();
        } catch (err) {
            message.error(err.response?.data?.message || "Impossible d'annuler.");
        }
    };

    const handleTrack = async (e) => {
        e.preventDefault();
        setTrackingError("");
        setTrackingResult(null);
        try {
            const res = await courriersApi.track(trackingQuery.trim());
            setTrackingResult(res.data);
        } catch (err) {
            setTrackingError(err.response?.data?.message || "Courrier introuvable.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Courriers</h1>
                {manage && (
                    <button
                        onClick={openForm}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800"
                    >
                        + Nouveau courrier
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                <h2 className="text-sm font-medium text-slate-700 mb-2">Suivre un courrier</h2>
                <form onSubmit={handleTrack} className="flex gap-2">
                    <input
                        required
                        value={trackingQuery}
                        onChange={(e) => setTrackingQuery(e.target.value)}
                        placeholder="Numéro de suivi (CR...)"
                        className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800"
                    >
                        Rechercher
                    </button>
                </form>
                {trackingError && <div className="mt-3 text-sm text-red-600">{trackingError}</div>}
                {trackingResult && (
                    <div className="mt-3 text-sm border border-slate-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-slate-500">{trackingResult.tracking_number}</span>
                            <StatusBadge status={trackingResult.status} />
                        </div>
                        <div>{trackingResult.departureAgency?.city} → {trackingResult.arrivalAgency?.city}</div>
                        <div className="text-slate-500">Destinataire : {trackingResult.receiver_name} ({trackingResult.receiver_phone})</div>
                    </div>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun courrier" }}
                    columns={[
                        {
                            title: "Suivi",
                            dataIndex: "tracking_number",
                            key: "tracking_number",
                            render: (value) => <span className="font-mono text-xs">{value}</span>
                        },
                        {
                            title: "Expéditeur",
                            dataIndex: "sender_name",
                            key: "sender_name"
                        },
                        {
                            title: "Destinataire",
                            dataIndex: "receiver_name",
                            key: "receiver_name"
                        },
                        {
                            title: "Trajet",
                            key: "trajet",
                            render: (_, c) => `${c.departureAgency?.city} → ${c.arrivalAgency?.city}`
                        },
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
                            render: (_, c) => manage && (
                                <Space size="small">
                                    {nextStatus[c.status] && (
                                        <Tooltip title={`Passer à ${nextStatus[c.status]}`}>
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<ArrowRightOutlined />}
                                                onClick={() => handleAdvance(c)}
                                            />
                                        </Tooltip>
                                    )}
                                    {["REGISTERED", "IN_TRANSIT"].includes(c.status) && (
                                        <Popconfirm
                                            title="Annuler ce courrier ?"
                                            onConfirm={() => handleCancel(c.id)}
                                            okText="Oui"
                                            cancelText="Non"
                                        >
                                            <Tooltip title="Annuler">
                                                <Button type="text" size="small" danger icon={<CloseCircleOutlined />} />
                                            </Tooltip>
                                        </Popconfirm>
                                    )}
                                </Space>
                            )
                        }
                    ]}
                    dataSource={courriers}
                />
            </div>

            {showForm && (
                <Modal title="Nouveau courrier" onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {formError && <div className="text-sm text-red-600">{formError}</div>}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Expéditeur</label>
                                <input
                                    required
                                    value={form.sender_name}
                                    onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Tél. expéditeur</label>
                                <input
                                    required
                                    value={form.sender_phone}
                                    onChange={(e) => setForm({ ...form, sender_phone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Destinataire</label>
                                <input
                                    required
                                    value={form.receiver_name}
                                    onChange={(e) => setForm({ ...form, receiver_name: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Tél. destinataire</label>
                                <input
                                    required
                                    value={form.receiver_phone}
                                    onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                            <input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Agence de départ</label>
                                <select
                                    required
                                    value={form.departure_agency_id}
                                    onChange={(e) => setForm({ ...form, departure_agency_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {agencies.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.city})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Agence d'arrivée</label>
                                <select
                                    required
                                    value={form.arrival_agency_id}
                                    onChange={(e) => setForm({ ...form, arrival_agency_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {agencies.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.city})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Voyage</label>
                            <select
                                required
                                value={form.trip_id}
                                onChange={(e) => setForm({ ...form, trip_id: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="">Sélectionner...</option>
                                {trips.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.TripRoute ? `${t.TripRoute.departure_city} → ${t.TripRoute.arrival_city}` : `Voyage #${t.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Quantité</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Poids (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    required
                                    value={form.weight}
                                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Prix</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Mode de paiement</label>
                            <select
                                value={form.payment_method}
                                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="CASH">Espèces</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="CARD">Carte</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting ? "Enregistrement..." : "Enregistrer le courrier"}
                        </button>
                    </form>
                </Modal>
            )}

            {deliverCourrier && (
                <Modal title={`Confirmer le retrait — ${deliverCourrier.tracking_number}`} onClose={() => setDeliverCourrier(null)}>
                    <form onSubmit={handleDeliverSubmit} className="space-y-3">

                        {deliverError && <div className="text-sm text-red-600">{deliverError}</div>}

                        <p className="text-sm text-slate-600">
                            Destinataire attendu : <strong>{deliverCourrier.receiver_name}</strong> ({deliverCourrier.receiver_phone})
                        </p>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de pièce d'identité du destinataire</label>
                            <input
                                required
                                value={identityNumber}
                                onChange={(e) => setIdentityNumber(e.target.value)}
                                placeholder="Ex: ML0123456"
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={delivering}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {delivering && <LoadingOutlined />}
                            {delivering ? "Confirmation..." : "Confirmer le retrait"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default CourriersPage;
