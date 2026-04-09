import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider } from './context/VaultContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MasterPasswordProvider } from './context/MasterPasswordContext';
import { ExtensionVaultBridge } from './components/extension/ExtensionVaultBridge';
import { AppLayout } from './components/layout/AppLayout';
import { CommandPalette } from './features/search/CommandPalette';
import { Toaster } from 'react-hot-toast';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { AnimatePresence } from 'framer-motion';
import { LoadingScreen } from './components/layout/LoadingScreen';

const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const VaultLibrary = React.lazy(() => import('./pages/VaultLibrary').then(module => ({ default: module.VaultLibrary })));
const ItemDetail = React.lazy(() => import('./pages/ItemDetail').then(module => ({ default: module.ItemDetail })));
const AddItem = React.lazy(() => import('./pages/AddItem').then(module => ({ default: module.AddItem })));
const SecurityAudit = React.lazy(() => import('./pages/SecurityAudit').then(module => ({ default: module.SecurityAudit })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const Contact = React.lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedRoutes() {
  return (
    <>
      <ExtensionVaultBridge />
      <AppLayout>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vault" element={<VaultLibrary />} />
              <Route path="/vault/:category" element={<VaultLibrary />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/add" element={<AddItem />} />
              <Route path="/add/:type" element={<AddItem />} />
              <Route path="/security" element={<SecurityAudit />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </AppLayout>
      <CommandPalette />
      <AIAssistantPanel />
    </>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <AuthGuard>
              <MasterPasswordProvider>
                <VaultProvider>
                  <AuthenticatedRoutes />
                </VaultProvider>
              </MasterPasswordProvider>
            </AuthGuard>
          } />
        </Routes>
      </Suspense>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          success: { duration: 3000 },
          error: { duration: 5000 },
          style: {
            fontSize: '14px',
            borderRadius: '12px',
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6',
            padding: '12px 16px',
            fontWeight: '600',
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
