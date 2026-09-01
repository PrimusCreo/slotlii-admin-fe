import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clinics from './pages/Clinics';
import ClinicDetail from './pages/ClinicDetail';
import Plans from './pages/Plans';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import ApiStatus from './pages/ApiStatus';
import AdminWhatsAppOverview from './pages/AdminWhatsAppOverview';
import AdminWhatsAppClinicDetail from './pages/AdminWhatsAppClinicDetail';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={250}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/clinics" element={<ProtectedRoute><Clinics /></ProtectedRoute>} />
              <Route path="/clinics/:id" element={<ProtectedRoute><ClinicDetail /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute><AdminWhatsAppOverview /></ProtectedRoute>} />
              <Route path="/whatsapp/clinics/:id" element={<ProtectedRoute><AdminWhatsAppClinicDetail /></ProtectedRoute>} />
              <Route path="/api-status" element={<ProtectedRoute><ApiStatus /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
