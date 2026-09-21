import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TripsPage from "./pages/trips/TripsPage";
import BookingsPage from "./pages/bookings/BookingsPage";
import TicketsPage from "./pages/tickets/TicketsPage";
import EmbarquementPage from "./pages/embarquement/EmbarquementPage";
import CourriersPage from "./pages/courriers/CourriersPage";
import BusesPage from "./pages/buses/BusesPage";
import RoutesPage from "./pages/routes/RoutesPage";
import AgenciesPage from "./pages/agencies/AgenciesPage";
import UsersPage from "./pages/users/UsersPage";
import PassengersPage from "./pages/passengers/PassengersPage";
import CompagniesPage from "./pages/compagnies/CompagniesPage";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="voyages" element={<TripsPage />} />
                        <Route path="bookings" element={<BookingsPage />} />
                        <Route path="tickets" element={<TicketsPage />} />
                        <Route path="embarquement" element={<EmbarquementPage />} />
                        <Route path="courriers" element={<CourriersPage />} />
                        <Route path="buses" element={<BusesPage />} />
                        <Route path="routes" element={<RoutesPage />} />
                        <Route path="agencies" element={<AgenciesPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="passengers" element={<PassengersPage />} />
                        <Route path="compagnies" element={<CompagniesPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
