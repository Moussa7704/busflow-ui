import { useEffect, useState } from "react";
import { ticketsApi } from "../../api/resources";
import StatusBadge from "../../components/StatusBadge";

const TicketsPage = () => {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [ticketNumber, setTicketNumber] = useState("");
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState("");
    const [scanning, setScanning] = useState(false);

    const loadTickets = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await ticketsApi.list({ limit: 50 });
            setTickets(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement des tickets.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        setScanError("");
        setScanResult(null);
        setScanning(true);
        try {
            const res = await ticketsApi.scan(ticketNumber.trim());
            setScanResult(res.data);
            setTicketNumber("");
            loadTickets();
        } catch (err) {
            setScanError(err.response?.data?.message || "Échec du scan.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div>
            <h1 className="text-lg font-semibold text-slate-900 mb-4">Tickets</h1>

            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                <h2 className="text-sm font-medium text-slate-700 mb-2">Scanner un ticket</h2>
                <form onSubmit={handleScan} className="flex gap-2">
                    <input
                        required
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                        placeholder="Numéro de ticket (TK-...)"
                        className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={scanning}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
                    >
                        {scanning ? "Vérification..." : "Scanner"}
                    </button>
                </form>

                {scanError && (
                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {scanError}
                    </div>
                )}

                {scanResult && (
                    <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        Ticket {scanResult.ticket_number} validé — passager embarqué.
                    </div>
                )}
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Ticket</th>
                            <th className="px-4 py-2 font-medium">Passager</th>
                            <th className="px-4 py-2 font-medium">Voyage</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium">Scanné le</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
                        ) : tickets.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucun ticket</td></tr>
                        ) : tickets.map((t) => (
                            <tr key={t.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 font-mono text-xs">{t.ticket_number}</td>
                                <td className="px-4 py-2">
                                    {t.booking?.passenger ? `${t.booking.passenger.first_name} ${t.booking.passenger.last_name}` : "-"}
                                </td>
                                <td className="px-4 py-2">
                                    {t.booking?.trip?.TripRoute ? `${t.booking.trip.TripRoute.departure_city} → ${t.booking.trip.TripRoute.arrival_city}` : "-"}
                                </td>
                                <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
                                <td className="px-4 py-2">{t.scanned_at ? new Date(t.scanned_at).toLocaleString("fr-FR") : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );

};

export default TicketsPage;
