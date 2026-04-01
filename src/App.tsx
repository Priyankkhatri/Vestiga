import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider, useVault } from './context/VaultContext';
import { LockScreen } from './pages/LockScreen';
import { Dashboard } from './pages/Dashboard';
import { VaultLibrary } from './pages/VaultLibrary';
import { ItemDetail } from './pages/ItemDetail';
import { AddItem } from './pages/AddItem';
import { SecurityAudit } from './pages/SecurityAudit';
import { Settings } from './pages/Settings';
import { AppLayout } from './components/layout/AppLayout';
import { CommandPalette } from './features/search/CommandPalette';
import { ToastContainer } from './components/ui/Toast';
import { AnimatePresence } from 'framer-motion';

function AppRoutes() {
  const { isLocked } = useVault();

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      <AppLayout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vault" element={<VaultLibrary />} />
            <Route path="/vault/:category" element={<VaultLibrary />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/add" element={<AddItem />} />
            <Route path="/add/:type" element={<AddItem />} />
            <Route path="/security" element={<SecurityAudit />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AppLayout>
      <CommandPalette />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VaultProvider>
        <AppRoutes />
      </VaultProvider>
    </BrowserRouter>
  );
}
