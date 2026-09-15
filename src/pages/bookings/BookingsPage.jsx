import { useEffect, useState } from "react";
import { bookingsApi, tripsApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../permissions";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

const emptyForm = {
    trip_id: "",
    phone: "",
    first_name: "",
    last_name: "",
    email: "",
    seats: 1,
    payment_methode: "CASH",
    paid_amount: ""
};

const BookingsPage = () => {

    const { user } = useAuth();
    const manage = can("bookings", "manage", user?.role);

    const [bookings, setBookings] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const loadBookings = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await bookingsApi.list({ limit: 50 });
            setBookings(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des réservations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const openForm = async () => {
        setForm(emptyForm);
        setFormError("");
        setLastResult(null);
        setShowForm(true);
        try {
            const res = await tripsApi.list({ limit: 100, status: "SCHEDULED" });
            setTrips(res.data);
        } catch {
            setTrips([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            const res = await bookingsApi.create({
                ...form,
                seats: Number(form.seats),
                paid_amount: form.paid_amount ? Number(form.paid_amount) : undefined
            });
            setLastResult(res.data);
            loadBookings();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("Annuler cette réservation ?")) return;
        try {
            await bookingsApi.cancel(id);
            loadBookings();
        } catch (err) {
            alert(err.response?.data?.message || "Impossible d'annuler.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Réservations</h1>
                {manage && (
                    <button
                        onClick={openForm}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800"
                    >
                        + Nouvelle réservation
                    </button>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Référence</th>
                            <th className="px-4 py-2 font-medium">Passager</th>
                            <th className="px-4 py-2 font-medium">Trajet</th>
                            <th className="px-4 py-2 font-medium">Siège</th>
                            <th className="px-4 py-2 font-medium">Montant</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Aucune réservation</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 font-mono text-xs">{b.booking_reference}</td>
                                <td className="px-4 py-2">{b.passenger ? `${b.passenger.first_name} ${b.passenger.last_name}` : "-"}</td>
                                <td className="px-4 py-2">
                                    {b.trip?.TripRoute ? `${b.trip.TripRoute.departure_city} → ${b.trip.TripRoute.arrival_city}` : `Voyage #${b.trip_id}`}
                                </td>
                                <td className="px-4 py-2">{b.seat_number}</td>
                                <td className="px-4 py-2">{b.paid_amount}</td>
                                <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                                <td className="px-4 py-2 text-right">
                                    {manage && b.status === "CONFIRMED" && (
                                        <button
                                            onClick={() => handleCancel(b.id)}
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
                <Modal title="Nouvelle réservation" onClose={() => setShowForm(false)}>

                    {lastResult ? (
                        <div className="space-y-3">
                            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                                Réservation créée avec succès.
                            </div>
                            {lastResult.map((booking) => (
                                <div key={booking.id} className="border border-slate-200 rounded-md p-3 text-sm">
                                    <div className="font-mono text-xs text-slate-500 mb-1">{booking.booking_reference}</div>
                                    <div>Siège n°{booking.seat_number}</div>
                                    {booking.ticket?.qr_code && (
                                        <img src={booking.ticket.qr_code} alt="QR code" className="w-32 h-32 mt-2" />
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800"
                            >
                                Fermer
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">

                            {formError && <div className="text-sm text-red-600">{formError}</div>}

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
                                            {t.TripRoute ? `${t.TripRoute.departure_city} → ${t.TripRoute.arrival_city}` : `Voyage #${t.id}`} — {t.available_seats} places — {t.price} FCFA
                                        </option>
                                    ))}
                                </select>
                            </div>

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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Places</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={form.seats}
                                        onChange={(e) => setForm({ ...form, seats: e.target.value })}
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Paiement</label>
                                    <select
                                        value={form.payment_methode}
                                        onChange={(e) => setForm({ ...form, payment_methode: e.target.value })}
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="CASH">Espèces</option>
                                        <option value="MOBILE_MONEY">Mobile Money</option>
                                        <option value="CARD">Carte</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                            >
                                {submitting ? "Création..." : "Créer la réservation"}
                            </button>
                        </form>
                    )}
                </Modal>
            )}

        </div>
    );

};

export default BookingsPage;
