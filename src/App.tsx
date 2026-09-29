import { useState, useEffect } from 'react';
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

  // 1. Desarrollo local por puerto dedicado
  const port = window.location.port;
  if (port === '5174') return 'admin';

  // 2. Build de producción dedicado por modo Vite
  if (import.meta.env.MODE === 'admin') return 'admin';

  // 3. Subdominio en producción (ej. admin.nightflow.vip o nightflow-admin.web.app)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('admin.') || hostname.includes('-admin.')) return 'admin';

  // 4. Ruta unificada /admin en producción
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';

  return 'client';
}

export function App() {
  const [portalType, setPortalType] = useState<'client' | 'admin'>(resolvePortalType);

  useEffect(() => {
    const handlePopState = () => setPortalType(resolvePortalType());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
