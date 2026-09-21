import { Table } from "antd";
import { ticketsApi } from "../../api/resources";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import StatusBadge from "../../components/StatusBadge";

const TicketsPage = () => {

    const { data: tickets, loading, error, pagination } = usePaginatedList(ticketsApi.list);

    return (
        <div>
            <h1 className="text-lg font-semibold text-slate-900 mb-4">Tickets</h1>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <Table
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    locale={{ emptyText: "Aucun ticket" }}
                    columns={[
                        {
                            title: "Ticket",
                            dataIndex: "ticket_number",
                            key: "ticket_number",
                            render: (value) => <span className="font-mono text-xs">{value}</span>
                        },
                        {
                            title: "Passager",
                            key: "passenger",
                            render: (_, t) => t.booking?.passenger ? `${t.booking.passenger.first_name} ${t.booking.passenger.last_name}` : "-"
                        },
                        {
                            title: "Voyage",
                            key: "voyage",
                            render: (_, t) => t.booking?.trip?.TripRoute ? `${t.booking.trip.TripRoute.departure_city} → ${t.booking.trip.TripRoute.arrival_city}` : "-"
                        },
                        {
                            title: "Statut",
                            dataIndex: "status",
                            key: "status",
                            render: (status) => <StatusBadge status={status} />
                        },
                        {
                            title: "Scanné le",
                            key: "scanned_at",
                            render: (_, t) => t.scanned_at ? new Date(t.scanned_at).toLocaleString("fr-FR") : "-"
                        }
                    ]}
                    dataSource={tickets}
                />
            </div>

        </div>
    );

};

export default TicketsPage;
