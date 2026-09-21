import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Space, Spin, message } from "antd";
import { ArrowRightOutlined, CloseCircleOutlined, EditOutlined, LoadingOutlined, TeamOutlined, PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { tripsApi, tripRoutesApi, busesApi, usersApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    compagny_id: "",
    route_id: "",
    bus_id: "",
    driver_id: "",
    departure_time: "",
    arrival_time: "",
    price: ""
};

const formatDate = (value) => new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const toDatetimeLocal = (value) => {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nextStatus = {
    SCHEDULED: "BOARDING",
    BOARDING: "DEPARTED",
    DEPARTED: "ARRIVED"
};

const TripsPage = () => {

    const { user } = useAuth();
    const manage = can("trips", "manage", user?.role);

    const { data: trips, loading, error, pagination, reload } = usePaginatedList(tripsApi.list);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [compagnies, setCompagnies] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

    const [manifestOpen, setManifestOpen] = useState(false);
    const [manifestLoading, setManifestLoading] = useState(false);
    const [manifest, setManifest] = useState(null);

    const [globalOpen, setGlobalOpen] = useState(false);
    const [globalRoutes, setGlobalRoutes] = useState([]);
    const [globalForm, setGlobalForm] = useState({ route_id: "", date: "", time: "" });
    const [globalError, setGlobalError] = useState("");
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalResult, setGlobalResult] = useState(null);

    const loadDropdowns = async (compagny_id, { excludeAssigned = true } = {}) => {
        setDropdownsLoaded(false);
        const params = compagny_id ? { compagny_id, limit: 100 } : { limit: 100 };
        const busParams = excludeAssigned ? { ...params, available_for_trip: true } : params;
        const [routesRes, busesRes, usersRes] = await Promise.all([
            tripRoutesApi.list(params),
            busesApi.list(busParams),
            usersApi.list(params)
        ]);
        setRoutes(routesRes.data);
        setBuses(busesRes.data);
        setDrivers(usersRes.data.filter((u) => u.Role?.name === "DRIVER"));
        setDropdownsLoaded(true);
    };

    const openForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
        setRoutes([]);
        setBuses([]);
        setDrivers([]);
        setDropdownsLoaded(false);
        if (isSuperAdmin(user?.role)) {
            compagniesApi.list({ limit: 100 }).then((res) => setCompagnies(res.data.filter((c) => c.status === "ACTIVE"))).catch(() => {});
        } else {
            loadDropdowns();
        }
    };

    const openEdit = (trip) => {
        setEditingId(trip.id);
        setForm({
            compagny_id: trip.compagny_id || "",
            route_id: trip.route_id || "",
            bus_id: trip.bus_id || "",
            driver_id: trip.driver_id || "",
            departure_time: trip.departure_time ? toDatetimeLocal(trip.departure_time) : "",
            arrival_time: trip.arrival_time ? toDatetimeLocal(trip.arrival_time) : "",
            price: trip.price ?? ""
        });
        setFormError("");
        setShowForm(true);
        setRoutes([]);
        setBuses([]);
        setDrivers([]);
        setDropdownsLoaded(false);
        if (isSuperAdmin(user?.role)) {
            compagniesApi.list({ limit: 100 }).then((res) => setCompagnies(res.data.filter((c) => c.status === "ACTIVE"))).catch(() => {});
        }
        loadDropdowns(trip.compagny_id, { excludeAssigned: false });
    };

    const handleCompagnyChange = (compagny_id) => {
        setForm((f) => ({ ...f, compagny_id, route_id: "", bus_id: "", driver_id: "" }));
        if (compagny_id) {
            loadDropdowns(compagny_id);
        } else {
            setRoutes([]);
            setBuses([]);
            setDrivers([]);
            setDropdownsLoaded(false);
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
                price: Number(form.price)
            };
            if (editingId) {
                await tripsApi.update(editingId, payload);
                message.success("Voyage modifié avec succès.");
            } else {
                await tripsApi.create(payload);
                message.success("Voyage créé avec succès.");
            }
            setShowForm(false);
            reload();
        } catch (err) {
            setFormError(err.response?.data?.message || (editingId ? "Erreur lors de la modification." : "Erreur lors de la création."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            await tripsApi.cancel(id);
            message.success("Voyage annulé.");
            reload();
        } catch (err) {
            message.error(err.response?.data?.message || "Impossible d'annuler.");
        }
    };

    const handleViewManifest = async (trip) => {
        setManifest(null);
        setManifestOpen(true);
        setManifestLoading(true);
        try {
            const res = await tripsApi.getPassengers(trip.id);
            setManifest(res.data);
        } catch (err) {
            message.error(err.response?.data?.message || "Impossible de charger la liste des passagers.");
            setManifestOpen(false);
        } finally {
            setManifestLoading(false);
        }
    };

    const handlePrintManifest = () => {
        window.print();
    };

    const openGlobalSearch = () => {
        setGlobalForm({ route_id: "", date: "", time: "" });
        setGlobalError("");
        setGlobalResult(null);
        setGlobalOpen(true);
        tripRoutesApi.list({ limit: 200 }).then((res) => setGlobalRoutes(res.data)).catch(() => setGlobalRoutes([]));
    };

    const handleGlobalSearch = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setGlobalResult(null);
        setGlobalLoading(true);
        try {
            const res = await tripsApi.getManifestByRoute({
                route_id: globalForm.route_id,
                date: globalForm.date,
                time: globalForm.time || undefined
            });
            setGlobalResult(res.data);
        } catch (err) {
            setGlobalError(err.response?.data?.message || "Erreur lors de la recherche.");
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleAdvanceStatus = async (trip) => {
        const status = nextStatus[trip.status];
        if (!status) return;
        try {
            await tripsApi.changeStatus(trip.id, status);
            message.success("Statut du voyage mis à jour.");
            reload();
        } catch (err) {
            message.error(err.response?.data?.message || "Transition impossible.");
        }
    };

    const columns = [
        {
            title: "Trajet",
            key: "trajet",
            render: (_, trip) => trip.TripRoute ? `${trip.TripRoute.departure_city} → ${trip.TripRoute.arrival_city}` : "-"
        },
        {
            title: "Bus",
            key: "bus",
            render: (_, trip) => trip.bus?.bus_number || "-"
        },
        {
            title: "Chauffeur",
            key: "chauffeur",
            render: (_, trip) => trip.Driver ? `${trip.Driver.first_name} ${trip.Driver.last_name}` : "-"
        },
        {
            title: "Départ",
            dataIndex: "departure_time",
            key: "departure_time",
            render: (value) => formatDate(value)
        },
        {
            title: "Places",
            dataIndex: "available_seats",
            key: "available_seats"
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
            render: (_, trip) => (
                <Space size="small">
                    <Tooltip title="Liste d'embarquement">
                        <Button
                            type="text"
                            size="small"
                            icon={<TeamOutlined />}
                            onClick={() => handleViewManifest(trip)}
                        />
                    </Tooltip>
                    {manage && trip.status !== "DEPARTED" && trip.status !== "ARRIVED" && (
                        <Tooltip title="Modifier">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEdit(trip)}
                            />
                        </Tooltip>
                    )}
                    {manage && nextStatus[trip.status] && (
                        <Tooltip title={`Passer à ${nextStatus[trip.status]}`}>
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowRightOutlined />}
                                onClick={() => handleAdvanceStatus(trip)}
                            />
                        </Tooltip>
                    )}
                    {manage && trip.status !== "CANCELLED" && trip.status !== "ARRIVED" && (
                        <Popconfirm
                            title="Annuler ce voyage ?"
                            onConfirm={() => handleCancel(trip.id)}
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
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Voyages</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openGlobalSearch}
                        className="border border-slate-300 text-slate-700 text-sm px-4 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2"
                    >
                        <SearchOutlined />
                        Liste globale
                    </button>
                    {manage && (
                        <button
                            onClick={openForm}
                            className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800"
                        >
                            + Nouveau voyage
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={trips}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun voyage" }}
                />
            </div>

            {showForm && (
                <Modal title={editingId ? "Modifier le voyage" : "Nouveau voyage"} onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {formError && <div className="text-sm text-red-600">{formError}</div>}

                        {isSuperAdmin(user?.role) && !editingId && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Compagnie</label>
                                <select
                                    required
                                    value={form.compagny_id}
                                    onChange={(e) => handleCompagnyChange(e.target.value)}
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
                            <label className="block text-xs font-medium text-slate-600 mb-1">Route</label>
                            <select
                                required
                                value={form.route_id}
                                onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="">Sélectionner...</option>
                                {routes.map((r) => (
                                    <option key={r.id} value={r.id}>{r.departure_city} → {r.arrival_city}</option>
                                ))}
                            </select>
                            {dropdownsLoaded && routes.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Aucune route pour cette compagnie. Créez-en une dans le menu Routes.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Bus</label>
                                <select
                                    required
                                    value={form.bus_id}
                                    onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {buses.map((b) => (
                                        <option key={b.id} value={b.id}>{b.bus_number} ({b.capacity} places)</option>
                                    ))}
                                </select>
                                {dropdownsLoaded && buses.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        Aucun bus pour cette compagnie. Créez-en un dans le menu Bus.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Chauffeur</label>
                                <select
                                    required
                                    value={form.driver_id}
                                    onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                                    ))}
                                </select>
                                {dropdownsLoaded && drivers.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        Aucun chauffeur pour cette compagnie. Créez un utilisateur avec le rôle DRIVER.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Départ</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.departure_time}
                                    onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Arrivée</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.arrival_time}
                                    onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Prix (FCFA)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting && <LoadingOutlined />}
                            {submitting
                                ? (editingId ? "Enregistrement..." : "Création...")
                                : (editingId ? "Enregistrer les modifications" : "Créer le voyage")}
                        </button>
                    </form>
                </Modal>
            )}

            {manifestOpen && (
                <Modal
                    title="Liste d'embarquement"
                    onClose={() => setManifestOpen(false)}
                >
                    {manifestLoading || !manifest ? (
                        <div className="flex items-center justify-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <div>
                            <div className="printable-area">
                                <div className="mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {manifest.trip.route?.departure_city} → {manifest.trip.route?.arrival_city}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Départ : {formatDate(manifest.trip.departure_time)} — Arrivée : {formatDate(manifest.trip.arrival_time)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Bus : {manifest.trip.bus?.bus_number || "-"} ({manifest.trip.bus?.plate_number || "-"})
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 mt-1">
                                        {manifest.total_passengers} passager{manifest.total_passengers > 1 ? "s" : ""}
                                    </p>
                                </div>

                                <table className="w-full text-sm border border-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left border-b border-slate-200">Siège</th>
                                            <th className="px-3 py-2 text-left border-b border-slate-200">Passager</th>
                                            <th className="px-3 py-2 text-left border-b border-slate-200">Téléphone</th>
                                            <th className="px-3 py-2 text-left border-b border-slate-200">Référence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manifest.passengers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                                                    Aucun passager confirmé pour ce voyage
                                                </td>
                                            </tr>
                                        ) : manifest.passengers.map((p) => (
                                            <tr key={p.booking_id} className="border-b border-slate-100">
                                                <td className="px-3 py-2">{p.seat_number}</td>
                                                <td className="px-3 py-2">{p.passenger?.first_name} {p.passenger?.last_name}</td>
                                                <td className="px-3 py-2">{p.passenger?.phone}</td>
                                                <td className="px-3 py-2 font-mono text-xs">{p.booking_reference}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handlePrintManifest}
                                className="no-print mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800"
                            >
                                <PrinterOutlined />
                                Imprimer la liste
                            </button>
                        </div>
                    )}
                </Modal>
            )}

            {globalOpen && (
                <Modal
                    title="Liste globale par route et date"
                    onClose={() => setGlobalOpen(false)}
                >
                    <form onSubmit={handleGlobalSearch} className="space-y-3 no-print">

                        {globalError && <div className="text-sm text-red-600">{globalError}</div>}

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Route</label>
                            <select
                                required
                                value={globalForm.route_id}
                                onChange={(e) => setGlobalForm({ ...globalForm, route_id: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="">Sélectionner...</option>
                                {globalRoutes.map((r) => (
                                    <option key={r.id} value={r.id}>{r.departure_city} → {r.arrival_city}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={globalForm.date}
                                    onChange={(e) => setGlobalForm({ ...globalForm, date: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Heure (optionnel)</label>
                                <input
                                    type="time"
                                    value={globalForm.time}
                                    onChange={(e) => setGlobalForm({ ...globalForm, time: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={globalLoading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {globalLoading && <LoadingOutlined />}
                            {globalLoading ? "Recherche..." : "Rechercher"}
                        </button>
                    </form>

                    {globalResult && (
                        <div className="mt-5">
                            <div className="printable-area">
                                <div className="mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {globalResult.route.departure_city} → {globalResult.route.arrival_city}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Date : {new Date(globalResult.date).toLocaleDateString("fr-FR")}
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 mt-1">
                                        {globalResult.total_trips} départ{globalResult.total_trips > 1 ? "s" : ""} — {globalResult.total_passengers} passager{globalResult.total_passengers > 1 ? "s" : ""} au total
                                    </p>
                                </div>

                                {globalResult.trips.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">
                                        Aucun départ trouvé pour cette route à cette date.
                                    </p>
                                ) : globalResult.trips.map((trip) => (
                                    <div key={trip.trip_id} className="mb-5">
                                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-t-md px-3 py-2">
                                            <span className="text-sm font-medium text-slate-800">
                                                Départ {formatDate(trip.departure_time).split(" ").pop()}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Bus : {trip.bus?.bus_number || "-"} — Chauffeur : {trip.driver ? `${trip.driver.first_name} ${trip.driver.last_name}` : "-"} — <StatusBadge status={trip.status} />
                                            </span>
                                        </div>
                                        <table className="w-full text-sm border border-t-0 border-slate-200">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-3 py-2 text-left border-b border-slate-200">Siège</th>
                                                    <th className="px-3 py-2 text-left border-b border-slate-200">Passager</th>
                                                    <th className="px-3 py-2 text-left border-b border-slate-200">Téléphone</th>
                                                    <th className="px-3 py-2 text-left border-b border-slate-200">Référence</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trip.passengers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-3 py-3 text-center text-slate-400">
                                                            Aucun passager confirmé
                                                        </td>
                                                    </tr>
                                                ) : trip.passengers.map((p) => (
                                                    <tr key={p.booking_id} className="border-b border-slate-100">
                                                        <td className="px-3 py-2">{p.seat_number}</td>
                                                        <td className="px-3 py-2">{p.passenger?.first_name} {p.passenger?.last_name}</td>
                                                        <td className="px-3 py-2">{p.passenger?.phone}</td>
                                                        <td className="px-3 py-2 font-mono text-xs">{p.booking_reference}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            {globalResult.trips.length > 0 && (
                                <button
                                    onClick={handlePrintManifest}
                                    className="no-print w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800"
                                >
                                    <PrinterOutlined />
                                    Imprimer la liste globale
                                </button>
                            )}
                        </div>
                    )}
                </Modal>
            )}

        </div>
    );

};

export default TripsPage;
