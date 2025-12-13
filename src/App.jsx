import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './context/NotificationContext';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Sales from './pages/Sales';
import Gates from './pages/Gates';
import MyLives from './pages/MyLives';
import GateStatusManager from './pages/GateStatusManager';
import LivesAdmin from './pages/LivesAdmin';
import UpdateGate from './pages/UpdateGate';
import BinAnalytics from './pages/BinAnalytics';
import InsertTestLives from './pages/InsertTestLives';
import Herramientas from './pages/Herramientas';
import EmailTemporal from './pages/EmailTemporal';
import SMSTemporal from './pages/SMSTemporal';
import FakeAddress from './pages/FakeAddress';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Orders from './pages/Orders';

function App() {
  return (
    <>
      <ToastProvider>
        <NotificationProvider>
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/analytics/*" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/billing" element={
          <ProtectedRoute>
            <Overview /> {/* Placeholder for billing, using Overview for now */}
          </ProtectedRoute>
        } />

        <Route path="/dashboard/settings/*" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/dashboard/users/*" element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        } />

        <Route path="/dashboard/sales/*" element={
          <AdminRoute>
            <Sales />
          </AdminRoute>
        } />

        <Route path="/dashboard/orders/*" element={
          <AdminRoute>
            <Orders />
          </AdminRoute>
        } />

        <Route path="/dashboard/gates/*" element={
          <ProtectedRoute>
            <Gates />
          </ProtectedRoute>
        } />

        <Route path="/gates/my-lives" element={
          <ProtectedRoute>
            <MyLives />
          </ProtectedRoute>
        } />

        <Route path="/admin/gate-status" element={
          <ProtectedRoute>
            <GateStatusManager />
          </ProtectedRoute>
        } />

        <Route path="/admin/lives" element={
          <ProtectedRoute>
            <LivesAdmin />
          </ProtectedRoute>
        } />

        <Route path="/update-gate" element={
          <ProtectedRoute>
            <UpdateGate />
          </ProtectedRoute>
        } />

        <Route path="/bin-analytics" element={
          <ProtectedRoute>
            <BinAnalytics />
          </ProtectedRoute>
        } />

        <Route path="/insert-test-lives" element={
          <ProtectedRoute>
            <InsertTestLives />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/herramientas/*" element={
          <ProtectedRoute>
            <Herramientas />
          </ProtectedRoute>
        } />

        {/* Herramientas Sub-routes */}
        <Route path="/dashboard/herramientas/email" element={
          <ProtectedRoute>
            <EmailTemporal />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/herramientas/sms" element={
          <ProtectedRoute>
            <SMSTemporal />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/herramientas/address" element={
          <ProtectedRoute>
            <FakeAddress />
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </NotificationProvider>
    </ToastProvider>
    <SpeedInsights />
    </>
  );
}

export default App;
