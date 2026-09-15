import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import TripsPage from "./pages/trips/TripsPage";
import BookingsPage from "./pages/bookings/BookingsPage";
import TicketsPage from "./pages/tickets/TicketsPage";
import CourriersPage from "./pages/courriers/CourriersPage";
import BusesPage from "./pages/buses/BusesPage";
import RoutesPage from "./pages/routes/RoutesPage";
import AgenciesPage from "./pages/agencies/AgenciesPage";
import UsersPage from "./pages/users/UsersPage";
import PassengersPage from "./pages/passengers/PassengersPage";
import CompagniesPage from "./pages/compagnies/CompagniesPage";

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
                        <Route index element={<TripsPage />} />
                        <Route path="bookings" element={<BookingsPage />} />
                        <Route path="tickets" element={<TicketsPage />} />
                        <Route path="courriers" element={<CourriersPage />} />
                        <Route path="buses" element={<BusesPage />} />
                        <Route path="routes" element={<RoutesPage />} />
                        <Route path="agencies" element={<AgenciesPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="passengers" element={<PassengersPage />} />
                        <Route path="compagnies" element={<CompagniesPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
