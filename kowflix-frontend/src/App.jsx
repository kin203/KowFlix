import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MaintenanceBanner from './components/MaintenanceBanner';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import SearchResults from './pages/SearchResults';
import AdminUpload from './pages/AdminUpload';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import JobManagement from './pages/JobManagement';
import UserManagement from './pages/UserManagement';
import HeroManagement from './pages/HeroManagement';
import ReviewManagement from './pages/ReviewManagement';
import ReportManagement from './pages/ReportManagement';
import NotificationManagement from './pages/NotificationManagement';
import NavMenuManagement from './pages/NavMenuManagement';
import AdminSettings from './pages/AdminSettings';
import CategoryPage from './pages/CategoryPage';
import CountryPage from './pages/CountryPage';
import AllCountriesPage from './pages/AllCountriesPage';
import MoviesPage from './pages/MoviesPage';
import GenrePage from './pages/GenrePage';
import Profile from './pages/Profile';
import MaintenancePage from './pages/MaintenancePage';
import NewAndPopular from './pages/NewAndPopular';
import PatrioticLoader from './components/PatrioticLoader';
import { settingAPI } from './services/api/settingAPI';
import './index.css';

function App() {
  return (
    <Router>
      <MaintenanceWrapper>
        <PatrioticLoader />
        <Routes>
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/movies" element={<AdminUpload />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/jobs" element={<JobManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/hero" element={<HeroManagement />} />
          <Route path="/admin/reviews" element={<ReviewManagement />} />
          <Route path="/admin/reports" element={<ReportManagement />} />
          <Route path="/admin/notifications" element={<NotificationManagement />} />
          <Route path="/admin/nav-menu" element={<NavMenuManagement />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/country" element={<AllCountriesPage />} />
          <Route path="/country/:country" element={<CountryPage />} />
          <Route path="/movie" element={<MoviesPage />} />
          <Route path="/genre/:genre" element={<GenrePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/new" element={<NewAndPopular />} />
        </Routes>
      </MaintenanceWrapper>
    </Router>
  );
}

// Maintenance Wrapper with countdown logic
const MaintenanceWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scheduledStart, setScheduledStart] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      // Check API for authoritative status
      try {
        const { data } = await settingAPI.getAll();
        const serverMaintenance = data.maintenanceMode === true;
        const start = data.maintenanceScheduledStart;
        setScheduledStart(start);

        // Update local storage to match server
        if (localStorage.getItem('maintenanceMode') !== String(serverMaintenance)) {
          localStorage.setItem('maintenanceMode', serverMaintenance);
        }

        const now = new Date().getTime();
        const startTime = start ? new Date(start).getTime() : 0;
        const isCountdownActive = serverMaintenance && start && now < startTime;
        const isMaintenanceActive = serverMaintenance && (!start || now >= startTime);

        setShowBanner(isCountdownActive);

        const isAdminRoute = location.pathname.startsWith('/admin');
        const isLogin = location.pathname === '/login';
        const isMaintenancePage = location.pathname === '/maintenance';

        if (isMaintenanceActive && !isAdminRoute && !isLogin && !isMaintenancePage) {
          navigate('/maintenance');
        }

        // If maintenance turned off but stuck on maintenance page
        if (!isMaintenanceActive && isMaintenancePage) {
          navigate('/');
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    };

    checkMaintenance();

    const interval = setInterval(checkMaintenance, 60000); // Check every minute

    // Listen for storage events (from other tabs) and custom events (from AdminSettings)
    window.addEventListener('storage', checkMaintenance);
    window.addEventListener('maintenance_update', checkMaintenance);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkMaintenance);
      window.removeEventListener('maintenance_update', checkMaintenance);
    };
  }, [location, navigate]);

  return (
    <>
      {showBanner && <MaintenanceBanner scheduledTime={scheduledStart} />}
      {children}
    </>
  );
};

export default App;
