import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clinics from './pages/Clinics';
import ClinicDetail from './pages/ClinicDetail';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Settings from './pages/Settings';
import ApiStatus from './pages/ApiStatus';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clinics" element={<ProtectedRoute><Clinics /></ProtectedRoute>} />
          <Route path="/clinics/:id" element={<ProtectedRoute><ClinicDetail /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/api-status" element={<ProtectedRoute><ApiStatus /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
