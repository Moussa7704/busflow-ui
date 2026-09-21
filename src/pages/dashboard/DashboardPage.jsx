import { useEffect, useState } from "react";
import { DatePicker, Segmented, Select } from "antd";
import dayjs from "dayjs";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList
} from "recharts";
import { dashboardApi, tripsApi } from "../../api/resources";

const COLOR_BOOKING = "#2a78d6";
const COLOR_COURRIER = "#eb6834";
const COLOR_BUS = "#1baf7a";

const BUS_STATE_COLORS = {
    available: "#1baf7a",
    in_trip: "#2a78d6",
    maintenance: "#eda100",
    out_of_service: "#e34948"
};

const BUS_STATE_LABELS = {
    available: "Disponible",
    in_trip: "En voyage",
    maintenance: "En maintenance",
    out_of_service: "Hors service"
};

const STATUS_COLORS = {
    REGISTERED: "#2a78d6",
    IN_TRANSIT: "#eb6834",
    ARRIVED: "#1baf7a",
    DELIVERED: "#eda100",
    CANCELLED: "#e87ba4"
};

const STATUS_LABELS = {
    REGISTERED: "Enregistré",
    IN_TRANSIT: "En transit",
    ARRIVED: "Arrivé",
    DELIVERED: "Livré",
    CANCELLED: "Annulé"
};

const { RangePicker } = DatePicker;

const RANGE_PRESETS = [
    { label: "7 derniers jours", value: [dayjs().subtract(6, "day"), dayjs()] },
    { label: "30 derniers jours", value: [dayjs().subtract(29, "day"), dayjs()] },
    { label: "90 derniers jours", value: [dayjs().subtract(89, "day"), dayjs()] },
    { label: "Ce mois-ci", value: [dayjs().startOf("month"), dayjs()] }
];

const DAY_PRESETS = [
    { label: "7 jours", value: 7 },
    { label: "30 jours", value: 30 },
    { label: "90 jours", value: 90 }
];

const formatAmount = (value) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
const formatDateShort = (value) => new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
const formatDateLabel = (value) => value.format("DD/MM/YYYY");
const formatTripDateTime = (value) => value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";

const KpiTile = ({ label, value, accent, size = "md" }) => (
    <div className={`bg-white rounded-lg border border-slate-200 ${size === "sm" ? "p-3" : "p-4"}`}>
        <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
        <div className={size === "sm" ? "text-lg font-semibold" : "text-2xl font-semibold"} style={{ color: accent || "#0b0b0b" }}>{value}</div>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-medium text-slate-700 mb-4">{title}</h2>
        <div style={{ width: "100%", height: 260 }}>
            {children}
        </div>
    </div>
);

const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 text-xs">
            <div className="text-slate-500 mb-1">{formatDateShort(label)}</div>
            <div className="font-medium text-slate-900">{formatAmount(payload[0].value)}</div>
        </div>
    );
};

const CountTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 text-xs">
            <div className="text-slate-500 mb-1">{formatDateShort(label)}</div>
            <div className="font-medium text-slate-900">{payload[0].value}</div>
        </div>
    );
};

const DashboardPage = () => {

    const [range, setRange] = useState([dayjs().subtract(29, "day"), dayjs()]);
    const [tripId, setTripId] = useState(null);
    const [trips, setTrips] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        tripsApi.list({ limit: 200 })
            .then((res) => setTrips(res.data))
            .catch(() => setTrips([]));
    }, []);

    useEffect(() => {
        if (!range || range.length !== 2) return;
        setLoading(true);
        setError("");
        dashboardApi.getSummary({
            start_date: range[0].format("YYYY-MM-DD"),
            end_date: range[1].format("YYYY-MM-DD"),
            trip_id: tripId || undefined
        })
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || "Erreur de chargement du tableau de bord."))
            .finally(() => setLoading(false));
    }, [range, tripId]);

    const selectedDaysPreset = (() => {
        if (!range || range.length !== 2) return undefined;
        const diff = range[1].startOf("day").diff(range[0].startOf("day"), "day") + 1;
        const isUpToToday = range[1].isSame(dayjs(), "day");
        return isUpToToday ? diff : undefined;
    })();

    const statusData = (data?.courrier_by_status || [])
        .filter((row) => STATUS_LABELS[row.status])
        .map((row) => ({
            status: STATUS_LABELS[row.status] || row.status,
            count: row.count,
            fill: STATUS_COLORS[row.status] || "#898781"
        }));

    const busData = data?.buses
        ? Object.keys(BUS_STATE_LABELS).map((key) => ({
            state: BUS_STATE_LABELS[key],
            count: data.buses[key] || 0,
            fill: BUS_STATE_COLORS[key]
        }))
        : [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Tableau de bord</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        allowClear
                        showSearch
                        placeholder="Tous les voyages"
                        style={{ width: 260 }}
                        value={tripId}
                        onChange={(value) => setTripId(value || null)}
                        optionFilterProp="label"
                        options={trips.map((t) => ({
                            value: t.id,
                            label: `${t.TripRoute ? `${t.TripRoute.departure_city} → ${t.TripRoute.arrival_city}` : `Voyage #${t.id}`} — ${formatTripDateTime(t.departure_time)}`
                        }))}
                    />
                    <Segmented
                        value={selectedDaysPreset}
                        onChange={(value) => setRange([dayjs().subtract(value - 1, "day"), dayjs()])}
                        options={DAY_PRESETS}
                    />
                    <RangePicker
                        value={range}
                        onChange={(value) => value && setRange(value)}
                        presets={RANGE_PRESETS}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        disabledDate={(current) => current && current > dayjs().endOf("day")}
                    />
                </div>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            {!loading && data && (
                <div className="space-y-4">

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <KpiTile label="Revenu réservations" value={formatAmount(data.kpis.total_booking_revenue)} accent={COLOR_BOOKING} />
                        <KpiTile label="Réservations" value={data.kpis.total_bookings.toLocaleString("fr-FR")} accent={COLOR_BOOKING} />
                        <KpiTile label="Revenu courriers" value={formatAmount(data.kpis.total_courrier_revenue)} accent={COLOR_COURRIER} />
                        <KpiTile label="Courriers enregistrés" value={data.kpis.total_courriers.toLocaleString("fr-FR")} accent={COLOR_COURRIER} />
                        {data.buses && (
                            <>
                                <KpiTile label="Total bus" value={data.buses.total.toLocaleString("fr-FR")} accent={COLOR_BUS} />
                                <KpiTile label="Bus en voyage" value={data.buses.in_trip.toLocaleString("fr-FR")} accent={BUS_STATE_COLORS.in_trip} />
                                <KpiTile label="Bus en maintenance" value={data.buses.maintenance.toLocaleString("fr-FR")} accent={BUS_STATE_COLORS.maintenance} />
                            </>
                        )}
                    </div>

                    {data.buses && (
                        <ChartCard title="Répartition de la flotte">
                            <ResponsiveContainer>
                                <BarChart data={busData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                    <XAxis dataKey="state" tick={{ fontSize: 11, fill: "#52514e" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                                    <Tooltip content={<CountTooltip />} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="count" position="top" style={{ fill: "#0b0b0b", fontSize: 12, fontWeight: 500 }} />
                                        {busData.map((entry) => (
                                            <Cell key={entry.state} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartCard title={`Revenu des réservations (${formatDateLabel(range[0])} – ${formatDateLabel(range[1])})`}>
                            <ResponsiveContainer>
                                <AreaChart data={data.booking_by_day} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Area type="monotone" dataKey="revenue" stroke={COLOR_BOOKING} fill={COLOR_BOOKING} fillOpacity={0.15} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Réservations par jour">
                            <ResponsiveContainer>
                                <BarChart data={data.booking_by_day} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                                    <Tooltip content={<CountTooltip />} />
                                    <Bar dataKey="count" fill={COLOR_BOOKING} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartCard title={`Revenu des courriers (${formatDateLabel(range[0])} – ${formatDateLabel(range[1])})`}>
                            <ResponsiveContainer>
                                <AreaChart data={data.courrier_by_day} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Area type="monotone" dataKey="revenue" stroke={COLOR_COURRIER} fill={COLOR_COURRIER} fillOpacity={0.15} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Courriers par jour">
                            <ResponsiveContainer>
                                <BarChart data={data.courrier_by_day} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                                    <Tooltip content={<CountTooltip />} />
                                    <Bar dataKey="count" fill={COLOR_COURRIER} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <ChartCard title="Courriers par statut">
                        <ResponsiveContainer>
                            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke="#e1e0d9" vertical={false} />
                                <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#52514e" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                                <Tooltip content={<CountTooltip />} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="count" position="top" style={{ fill: "#0b0b0b", fontSize: 12, fontWeight: 500 }} />
                                    {statusData.map((entry) => (
                                        <Cell key={entry.status} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                </div>
            )}
        </div>
    );

};

export default DashboardPage;
