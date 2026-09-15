const colors = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    BOARDING: "bg-amber-100 text-amber-700",
    DEPARTED: "bg-purple-100 text-purple-700",
    ARRIVED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-slate-200 text-slate-700",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    USED: "bg-slate-200 text-slate-700",
    REGISTERED: "bg-blue-100 text-blue-700",
    IN_TRANSIT: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-emerald-100 text-emerald-700"
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-slate-100 text-slate-600"}`}>
        {status}
    </span>
);

export default StatusBadge;
