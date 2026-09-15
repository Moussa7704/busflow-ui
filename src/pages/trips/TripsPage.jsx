import { useEffect, useState } from "react";
import { tripsApi, tripRoutesApi, busesApi, usersApi, compagniesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can, isSuperAdmin } from "../../permissions";
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

const TripsPage = () => {

    const { user } = useAuth();
    const manage = can("trips", "manage", user?.role);

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [compagnies, setCompagnies] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [drivers, setDrivers] = useState([]);

    const loadTrips = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await tripsApi.list({ limit: 50 });
            setTrips(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des voyages.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrips();
        if (isSuperAdmin(user?.role)) {
            compagniesApi.list({ limit: 100 }).then((res) => setCompagnies(res.data)).catch(() => {});
        }
    }, []);

    const loadDropdowns = async (compagny_id) => {
        const params = compagny_id ? { compagny_id, limit: 100 } : { limit: 100 };
        const [routesRes, busesRes, usersRes] = await Promise.all([
            tripRoutesApi.list(params),
            busesApi.list(params),
            usersApi.list(params)
        ]);
        setRoutes(routesRes.data);
        setBuses(busesRes.data);
        setDrivers(usersRes.data.filter((u) => u.Role?.name === "DRIVER"));
    };

    const openForm = () => {
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
        if (!isSuperAdmin(user?.role)) {
            loadDropdowns();
        }
    };

    const handleCompagnyChange = (compagny_id) => {
        setForm((f) => ({ ...f, compagny_id, route_id: "", bus_id: "", driver_id: "" }));
        if (compagny_id) {
            loadDropdowns(compagny_id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            await tripsApi.create({
                ...form,
                compagny_id: form.compagny_id || undefined,
                price: Number(form.price)
            });
            setShowForm(false);
            loadTrips();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("Annuler ce voyage ?")) return;
        try {
            await tripsApi.cancel(id);
            loadTrips();
        } catch (err) {
            alert(err.response?.data?.message || "Impossible d'annuler.");
        }
    };

    const nextStatus = {
        SCHEDULED: "BOARDING",
        BOARDING: "DEPARTED",
        DEPARTED: "ARRIVED"
    };

    const handleAdvanceStatus = async (trip) => {
        const status = nextStatus[trip.status];
        if (!status) return;
        try {
            await tripsApi.changeStatus(trip.id, status);
            loadTrips();
        } catch (err) {
            alert(err.response?.data?.message || "Transition impossible.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Voyages</h1>
                {manage && (
                    <button
                        onClick={openForm}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800"
                    >
                        + Nouveau voyage
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Trajet</th>
                            <th className="px-4 py-2 font-medium">Bus</th>
                            <th className="px-4 py-2 font-medium">Chauffeur</th>
                            <th className="px-4 py-2 font-medium">Départ</th>
                            <th className="px-4 py-2 font-medium">Places</th>
                            <th className="px-4 py-2 font-medium">Prix</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : trips.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Aucun voyage</td></tr>
                        ) : trips.map((trip) => (
                            <tr key={trip.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">
                                    {trip.TripRoute ? `${trip.TripRoute.departure_city} → ${trip.TripRoute.arrival_city}` : "-"}
                                </td>
                                <td className="px-4 py-2">{trip.bus?.bus_number || "-"}</td>
                                <td className="px-4 py-2">{trip.Driver ? `${trip.Driver.first_name} ${trip.Driver.last_name}` : "-"}</td>
                                <td className="px-4 py-2">{formatDate(trip.departure_time)}</td>
                                <td className="px-4 py-2">{trip.available_seats}</td>
                                <td className="px-4 py-2">{trip.price}</td>
                                <td className="px-4 py-2"><StatusBadge status={trip.status} /></td>
                                <td className="px-4 py-2 text-right space-x-2">
                                    {manage && nextStatus[trip.status] && (
                                        <button
                                            onClick={() => handleAdvanceStatus(trip)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            → {nextStatus[trip.status]}
                                        </button>
                                    )}
                                    {manage && trip.status !== "CANCELLED" && trip.status !== "ARRIVED" && (
                                        <button
                                            onClick={() => handleCancel(trip.id)}
                                            className="text-xs text-red-600 hover:underline"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title="Nouveau voyage" onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {formError && <div className="text-sm text-red-600">{formError}</div>}

                        {isSuperAdmin(user?.role) && (
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
                            className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {submitting ? "Création..." : "Créer le voyage"}
                        </button>
                    </form>
                </Modal>
            )}

        </div>
    );

};

export default TripsPage;
