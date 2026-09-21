import api from "./client";

export const tripRoutesApi = {
    list: (params) => api.get("/trip-routes", { params }).then((r) => r.data),
    create: (data) => api.post("/trip-routes", data).then((r) => r.data),
    update: (id, data) => api.put(`/trip-routes/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/trip-routes/${id}`).then((r) => r.data)
};

export const busesApi = {
    list: (params) => api.get("/buses", { params }).then((r) => r.data),
    create: (data) => api.post("/buses", data).then((r) => r.data),
    update: (id, data) => api.put(`/buses/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/buses/${id}`).then((r) => r.data),
    changeStatus: (id, status) => api.patch(`/buses/${id}/status`, { status }).then((r) => r.data)
};

export const usersApi = {
    list: (params) => api.get("/users", { params }).then((r) => r.data),
    create: (data) => api.post("/users", data).then((r) => r.data),
    update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
    changeStatus: (id) => api.patch(`/users/${id}/status`).then((r) => r.data)
};

export const rolesApi = {
    list: () => api.get("/roles").then((r) => r.data)
};

export const tripsApi = {
    list: (params) => api.get("/trips", { params }).then((r) => r.data),
    create: (data) => api.post("/trips", data).then((r) => r.data),
    update: (id, data) => api.put(`/trips/${id}`, data).then((r) => r.data),
    changeStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }).then((r) => r.data),
    cancel: (id) => api.patch(`/trips/${id}/cancel`).then((r) => r.data),
    getPassengers: (id) => api.get(`/trips/${id}/passengers`).then((r) => r.data),
    getManifestByRoute: (params) => api.get("/trips/manifest", { params }).then((r) => r.data)
};

export const bookingsApi = {
    list: (params) => api.get("/bookings", { params }).then((r) => r.data),
    create: (data) => api.post("/bookings", data).then((r) => r.data),
    update: (id, data) => api.put(`/bookings/${id}`, data).then((r) => r.data),
    cancel: (id) => api.patch(`/bookings/${id}/cancel`).then((r) => r.data)
};

export const ticketsApi = {
    list: (params) => api.get("/tickets", { params }).then((r) => r.data),
    scan: (ticket_number) => api.post("/tickets/scan", { ticket_number }).then((r) => r.data),
    cancel: (id) => api.patch(`/tickets/${id}/cancel`).then((r) => r.data)
};

export const courriersApi = {
    list: (params) => api.get("/courriers", { params }).then((r) => r.data),
    create: (data) => api.post("/courriers", data).then((r) => r.data),
    changeStatus: (id, status, extra) => api.patch(`/courriers/${id}/status`, { status, ...extra }).then((r) => r.data),
    cancel: (id) => api.patch(`/courriers/${id}/cancel`).then((r) => r.data),
    track: (tracking_number) => api.get(`/courriers/tracking/${tracking_number}`).then((r) => r.data)
};

export const agenciesApi = {
    list: (params) => api.get("/agences", { params }).then((r) => r.data),
    create: (data) => api.post("/agences", data).then((r) => r.data),
    update: (id, data) => api.put(`/agences/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/agences/${id}`).then((r) => r.data)
};

export const compagniesApi = {
    list: (params) => api.get("/compagnies", { params }).then((r) => r.data),
    get: (id) => api.get(`/compagnies/${id}`).then((r) => r.data),
    create: (data) => api.post("/compagnies", data).then((r) => r.data),
    update: (id, data) => api.put(`/compagnies/${id}`, data).then((r) => r.data),
    remove: (id) => api.delete(`/compagnies/${id}`).then((r) => r.data)
};

export const passengersApi = {
    list: (params) => api.get("/passengers", { params }).then((r) => r.data),
    create: (data) => api.post("/passengers", data).then((r) => r.data),
    update: (id, data) => api.put(`/passengers/${id}`, data).then((r) => r.data)
};

export const dashboardApi = {
    getSummary: (params) => api.get("/dashboard/summary", { params }).then((r) => r.data)
};

export const profileApi = {
    get: () => api.get("/auth/me").then((r) => r.data),
    update: (data) => api.put("/auth/me", data).then((r) => r.data),
    changePassword: (data) => api.put("/auth/me/password", data).then((r) => r.data)
};
