import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SaasRoutes } from './components/saas/SaasApp';
import { AdminPortalApp } from './components/club/AdminPortalApp';
import './App.css';

/**
 * Determina si el entorno actual corresponde al Portal de Clientes (5173)
 * o al Portal de Gestión y Administración (5174 / --mode admin).
 *
 * Seguridad 10.1: los parámetros de URL (?portal=, ?view=) ya no enrutan
 * al portal admin ni cambian roles. Solo el puerto local y el modo Vite
 * determinan el portal; los roles se asignan desde el servidor.
 */
function resolvePortalType(): 'client' | 'admin' {
  if (typeof window === 'undefined') return 'client';

  const port = window.location.port;
  if (port === '5174') return 'admin';
  if (import.meta.env.MODE === 'admin') return 'admin';

  return 'client';
}

export function App() {
  const [portalType] = useState<'client' | 'admin'>(resolvePortalType);

  if (portalType === 'admin') {
    return <AdminPortalApp />;
  }

  return (
    <BrowserRouter>
      <SaasRoutes />
    </BrowserRouter>
  );
}

export default App;
