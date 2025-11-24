import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Watch from './pages/Watch';
import AdminUpload from './pages/AdminUpload';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import UserManagement from './pages/UserManagement';
import HeroManagement from './pages/HeroManagement';
import ReviewManagement from './pages/ReviewManagement';
import NotificationManagement from './pages/NotificationManagement';
import Profile from './pages/Profile';
import PatrioticLoader from './components/PatrioticLoader';
import './index.css';

function App() {
  return (
    <Router>
      <PatrioticLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/admin" element={<AdminUpload />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/movies" element={<AdminUpload />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/hero" element={<HeroManagement />} />
        <Route path="/admin/reviews" element={<ReviewManagement />} />
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
