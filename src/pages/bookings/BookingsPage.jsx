import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, message } from "antd";
import { CloseCircleOutlined, EditOutlined, LoadingOutlined, PrinterOutlined } from "@ant-design/icons";
import { bookingsApi, tripsApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { can } from "../../permissions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
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

const formatDateTime = (value) => new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const BookingsPage = () => {

    const { user } = useAuth();
    const manage = can("bookings", "manage", user?.role);

    const { data: bookings, loading, error, pagination, reload } = usePaginatedList(bookingsApi.list);
    const [trips, setTrips] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const [editBooking, setEditBooking] = useState(null);
    const [editForm, setEditForm] = useState({ payment_methode: "CASH", paid_amount: "" });
    const [editError, setEditError] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [printBooking, setPrintBooking] = useState(null);

    const openForm = async () => {
        setForm(emptyForm);
        setFormError("");
        setLastResult(null);
        setShowForm(true);
        try {
            const res = await tripsApi.list({ limit: 100 });
            setTrips(res.data.filter((t) => t.status === "SCHEDULED" || t.status === "BOARDING"));
        } catch {
            setTrips([]);
        }
    };

    const selectedTrip = trips.find((t) => String(t.id) === String(form.trip_id));

    const handleTripChange = (tripId) => {
        const trip = trips.find((t) => String(t.id) === String(tripId));
        setForm((f) => ({
            ...f,
            trip_id: tripId,
            paid_amount: trip ? trip.price : f.paid_amount
        }));
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
            message.success("Réservation créée avec succès.");
            reload();
        } catch (err) {
            setFormError(err.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            await bookingsApi.cancel(id);
            message.success("Réservation annulée.");
            reload();
        } catch (err) {
            message.error(err.response?.data?.message || "Impossible d'annuler.");
        }
    };

    const openEditBooking = (booking) => {
        setEditBooking(booking);
        setEditForm({
            payment_methode: booking.payment_methode || "CASH",
            paid_amount: booking.paid_amount ?? ""
        });
        setEditError("");
    };

    const handlePrintTicket = () => {
        window.print();
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError("");
        setEditSubmitting(true);
        try {
            await bookingsApi.update(editBooking.id, {
                payment_methode: editForm.payment_methode,
                paid_amount: editForm.paid_amount ? Number(editForm.paid_amount) : undefined
            });
            message.success("Réservation modifiée avec succès.");
            setEditBooking(null);
            reload();
        } catch (err) {
            setEditError(err.response?.data?.message || "Erreur lors de la modification.");
        } finally {
            setEditSubmitting(false);
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
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucune réservation" }}
                    columns={[
                        {
                            title: "Référence",
                            dataIndex: "booking_reference",
                            key: "booking_reference",
                            render: (value) => <span className="font-mono text-xs">{value}</span>
                        },
                        {
                            title: "Passager",
                            key: "passenger",
                            render: (_, b) => b.passenger ? `${b.passenger.first_name} ${b.passenger.last_name}` : "-"
                        },
                        {
                            title: "Trajet",
                            key: "trajet",
                            render: (_, b) => b.trip?.TripRoute ? `${b.trip.TripRoute.departure_city} → ${b.trip.TripRoute.arrival_city}` : `Voyage #${b.trip_id}`
                        },
                        {
                            title: "Départ",
                            key: "departure_time",
                            render: (_, b) => b.trip?.departure_time ? formatDateTime(b.trip.departure_time) : "-"
                        },
                        {
                            title: "Siège",
                            dataIndex: "seat_number",
                            key: "seat_number"
                        },
                        {
                            title: "Montant",
                            dataIndex: "paid_amount",
                            key: "paid_amount"
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
                            render: (_, b) => manage && b.status === "CONFIRMED" && (
                                <>
                                    {b.ticket && (
                                        <Tooltip title="Imprimer le ticket">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<PrinterOutlined />}
                                                onClick={() => setPrintBooking(b)}
                                            />
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Modifier">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openEditBooking(b)}
                                        />
                                    </Tooltip>
                                    <Popconfirm
                                        title="Annuler cette réservation ?"
                                        onConfirm={() => handleCancel(b.id)}
                                        okText="Oui"
                                        cancelText="Non"
                                    >
                                        <Tooltip title="Annuler">
                                            <Button type="text" size="small" danger icon={<CloseCircleOutlined />} />
                                        </Tooltip>
                                    </Popconfirm>
                                </>
                            )
                        }
                    ]}
                    dataSource={bookings}
                />
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
                                    onChange={(e) => handleTripChange(e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Sélectionner...</option>
                                    {trips.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.TripRoute ? `${t.TripRoute.departure_city} → ${t.TripRoute.arrival_city}` : `Voyage #${t.id}`} — {formatDateTime(t.departure_time)}
                                        </option>
                                    ))}
                                </select>
                                {selectedTrip && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {selectedTrip.available_seats} place{selectedTrip.available_seats > 1 ? "s" : ""} disponible{selectedTrip.available_seats > 1 ? "s" : ""}
                                    </p>
                                )}
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

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Prix (FCFA)</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    readOnly
                                    value={form.paid_amount}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                            >
                                {submitting && <LoadingOutlined />}
                                {submitting ? "Création..." : "Créer la réservation"}
                            </button>
                        </form>
                    )}
                </Modal>
            )}

            {editBooking && (
                <Modal title={`Modifier la réservation ${editBooking.booking_reference}`} onClose={() => setEditBooking(null)}>
                    <form onSubmit={handleEditSubmit} className="space-y-3">

                        {editError && <div className="text-sm text-red-600">{editError}</div>}

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Paiement</label>
                            <select
                                value={editForm.payment_methode}
                                onChange={(e) => setEditForm({ ...editForm, payment_methode: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="CASH">Espèces</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="CARD">Carte</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Montant payé (FCFA)</label>
                            <input
                                type="number"
                                min="0"
                                value={editForm.paid_amount}
                                onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={editSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                        >
                            {editSubmitting && <LoadingOutlined />}
                            {editSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </form>
                </Modal>
            )}

            {printBooking && (
                <Modal title="Ticket" onClose={() => setPrintBooking(null)}>
                    <div className="printable-area">
                        <div className="mb-4 text-center">
                            <h3 className="text-base font-semibold text-slate-900">
                                {printBooking.trip?.TripRoute ? `${printBooking.trip.TripRoute.departure_city} → ${printBooking.trip.TripRoute.arrival_city}` : `Voyage #${printBooking.trip_id}`}
                            </h3>
                            {printBooking.trip?.departure_time && (
                                <p className="text-sm text-slate-500">
                                    Départ : {formatDateTime(printBooking.trip.departure_time)}
                                </p>
                            )}
                        </div>

                        <div className="border border-slate-200 rounded-md p-4 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Référence</span>
                                <span className="font-mono">{printBooking.booking_reference}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Passager</span>
                                <span>{printBooking.passenger ? `${printBooking.passenger.first_name} ${printBooking.passenger.last_name}` : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Téléphone</span>
                                <span>{printBooking.passenger?.phone || "-"}</span>
                            </div>
                            {printBooking.passenger?.email && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email</span>
                                    <span>{printBooking.passenger.email}</span>
                                </div>
                            )}
                            {printBooking.passenger?.identity_number && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Pièce d'identité</span>
                                    <span>{printBooking.passenger.identity_number}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">Siège</span>
                                <span>{printBooking.seat_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Montant</span>
                                <span>{printBooking.paid_amount} FCFA</span>
                            </div>
                        </div>

                        {printBooking.ticket?.qr_code && (
                            <div className="flex justify-center mt-4">
                                <img src={printBooking.ticket.qr_code} alt="QR code" className="w-40 h-40" />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handlePrintTicket}
                        className="no-print mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800"
                    >
                        <PrinterOutlined />
                        Imprimer le ticket
                    </button>
                </Modal>
            )}

        </div>
    );

};

export default BookingsPage;
