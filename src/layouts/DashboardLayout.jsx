import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { can } from "../permissions";

const sections = [
    {
        label: "Exploitation",
        items: [
            { to: "/", label: "Voyages", end: true, moduleKey: "trips" },
            { to: "/bookings", label: "Réservations", moduleKey: "bookings" },
            { to: "/tickets", label: "Tickets", moduleKey: "tickets" },
            { to: "/courriers", label: "Courriers", moduleKey: "courriers" }
        ]
    },
    {
        label: "Ressources",
        items: [
            { to: "/buses", label: "Bus", moduleKey: "buses" },
            { to: "/routes", label: "Routes", moduleKey: "tripRoutes" },
            { to: "/agencies", label: "Agences", moduleKey: "agencies" },
            { to: "/passengers", label: "Passagers", moduleKey: "passengers" }
        ]
    },
    {
        label: "Administration",
        items: [
            { to: "/users", label: "Utilisateurs", moduleKey: "users" },
            { to: "/compagnies", label: "Compagnies", moduleKey: "compagnies" }
        ]
    }
];

const DashboardLayout = () => {

    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex bg-slate-50">

            <aside className="w-56 shrink-0 bg-slate-900 text-slate-200 flex flex-col overflow-y-auto">
                <div className="px-5 py-4 text-lg font-semibold text-white border-b border-slate-800">
                    BusFlow
                </div>
                <nav className="flex-1 py-4">
                    {sections.map((section) => {
                        const items = section.items.filter((item) => can(item.moduleKey, "view", user?.role));
                        if (items.length === 0) return null;
                        return (
                            <div key={section.label} className="mb-4">
                                <div className="px-5 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-medium">
                                    {section.label}
                                </div>
                                <div className="space-y-1">
                                    {items.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) =>
                                                `block px-5 py-2 text-sm ${
                                                    isActive
                                                        ? "bg-slate-800 text-white font-medium"
                                                        : "text-slate-300 hover:bg-slate-800/60"
                                                }`
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">

                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                    <div className="text-sm text-slate-500">
                        Rôle : <span className="font-medium text-slate-800">{user?.role}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm text-slate-500 hover:text-red-600"
                    >
                        Déconnexion
                    </button>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>

            </div>

        </div>
    );

};

export default DashboardLayout;
