import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import NotificationManagement from './pages/NotificationManagement';
import NavMenuManagement from './pages/NavMenuManagement';
import AdminSettings from './pages/AdminSettings';
import CategoryPage from './pages/CategoryPage';
import Profile from './pages/Profile';
import MaintenancePage from './pages/MaintenancePage';
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
          <Route path="/admin/notifications" element={<NotificationManagement />} />
          <Route path="/admin/nav-menu" element={<NavMenuManagement />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MaintenanceWrapper>
    </Router>
  );
}

// Simple wrapper to handle maintenance redirect
const MaintenanceWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const checkMaintenance = async () => {
      // Check API for authoritative status
      try {
        const { data } = await settingAPI.getAll();
        const serverMaintenance = data.maintenanceMode === true;

        // Update local storage to match server
        if (localStorage.getItem('maintenanceMode') !== String(serverMaintenance)) {
          localStorage.setItem('maintenanceMode', serverMaintenance);
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }

      const isMaintenance = localStorage.getItem('maintenanceMode') === 'true';
      const isAdminRoute = location.pathname.startsWith('/admin');
      const isLogin = location.pathname === '/login';
      const isMaintenancePage = location.pathname === '/maintenance';

      if (isMaintenance && !isAdminRoute && !isLogin && !isMaintenancePage) {
        navigate('/maintenance');
      }

      // If maintenance turned off but stuck on maintenance page
      if (!isMaintenance && isMaintenancePage) {
        navigate('/');
      }
    };

    checkMaintenance();

    // Listen for storage events (from other tabs) and custom events (from AdminSettings)
    window.addEventListener('storage', checkMaintenance);
    window.addEventListener('maintenance_update', checkMaintenance);

    return () => {
      window.removeEventListener('storage', checkMaintenance);
      window.removeEventListener('maintenance_update', checkMaintenance);
    };
  }, [location, navigate]);

  return children;
};

export default App;
