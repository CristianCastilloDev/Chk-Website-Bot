import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './context/NotificationContext';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LazyLoadingFallback from './components/LazyLoadingFallback';

// Critical pages - loaded immediately for fast initial render
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Lazy-loaded pages - loaded on demand
const Overview = lazy(() => import('./pages/Overview'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Users = lazy(() => import('./pages/Users'));
const Sales = lazy(() => import('./pages/Sales'));
const Gates = lazy(() => import('./pages/Gates'));
const MyLives = lazy(() => import('./pages/MyLives'));
const GateStatusManager = lazy(() => import('./pages/GateStatusManager'));
const LivesAdmin = lazy(() => import('./pages/LivesAdmin'));
const UpdateGate = lazy(() => import('./pages/UpdateGate'));
const BinAnalytics = lazy(() => import('./pages/BinAnalytics'));
const InsertTestLives = lazy(() => import('./pages/InsertTestLives'));
const Herramientas = lazy(() => import('./pages/Herramientas'));
const EmailTemporal = lazy(() => import('./pages/EmailTemporal'));
const SMSTemporal = lazy(() => import('./pages/SMSTemporal'));
const FakeAddress = lazy(() => import('./pages/FakeAddress'));
const Settings = lazy(() => import('./pages/Settings'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Orders = lazy(() => import('./pages/Orders'));
const Earnings = lazy(() => import('./pages/Earnings'));


function App() {
  return (
    <>
      <ToastProvider>
        <NotificationProvider>
          <Suspense fallback={<LazyLoadingFallback />}>
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

              <Route path="/dashboard/earnings/*" element={
                <ProtectedRoute>
                  <Earnings />
                </ProtectedRoute>
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
          </Suspense>
        </NotificationProvider>
      </ToastProvider>
      <SpeedInsights />
    </>
  );
}

export default App;
