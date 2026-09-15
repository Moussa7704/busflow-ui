// Miroir des listes authorize(...) du backend (routes/*.js) pour chaque module.
export const modules = {
    trips: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN"]
    },
    bookings: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT", "CONTROLLER"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT"]
    },
    tickets: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT", "CONTROLLER"],
        scan: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "CONTROLLER"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT"]
    },
    courriers: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT"],
        delete: ["SUPER_ADMIN", "COMPAGNY_ADMIN"]
    },
    buses: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN"]
    },
    tripRoutes: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN"]
    },
    agencies: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN"]
    },
    users: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN"]
    },
    passengers: {
        view: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT", "CONTROLLER"],
        manage: ["SUPER_ADMIN", "COMPAGNY_ADMIN", "AGENCY_ADMIN", "AGENT"]
    },
    compagnies: {
        view: ["SUPER_ADMIN"],
        manage: ["SUPER_ADMIN"]
    }
};

export const can = (moduleKey, action, role) => {
    const list = modules[moduleKey]?.[action];
    return Array.isArray(list) && list.includes(role);
};

export const isSuperAdmin = (role) => role === "SUPER_ADMIN";
