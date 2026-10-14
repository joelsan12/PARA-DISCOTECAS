import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SaasRoutes } from './components/saas/SaasApp';
import { AdminPortalApp } from './components/club/AdminPortalApp';
import { DevPortalApp } from './components/dev/DevPortalApp';
import { BetaFeedbackWidget } from './components/common/BetaFeedbackWidget';

export type PortalType = 'client' | 'admin' | 'dev';

/**
 * Determina si el entorno actual corresponde al Portal de Clientes (5173),
 * al Portal de Gestión y Administración (5174 / --mode admin)
 * o a la Consola de Desarrollador / SuperAdmin (5175 / --mode dev).
 */
function resolvePortalType(): PortalType {
  if (typeof window === 'undefined') return 'client';

  // 1. Desarrollo local por puerto dedicado
  const port = window.location.port;
  if (port === '5175') return 'dev';
  if (port === '5174') return 'admin';

  // 2. Build de producción dedicado por modo Vite
  if (import.meta.env.MODE === 'dev') return 'dev';
  if (import.meta.env.MODE === 'admin') return 'admin';

  // 3. Subdominio en producción (ej. dev.nightflow.vip o nightflow-dev.web.app)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('dev.') || hostname.includes('-dev.')) return 'dev';
  if (hostname.startsWith('admin.') || hostname.includes('-admin.')) return 'admin';

  // 4. Ruta unificada en producción (/dev, /admin)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/dev' || pathname.startsWith('/dev/')) return 'dev';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';

  return 'client';
}

export function App() {
  const [portalType, setPortalType] = useState<PortalType>(resolvePortalType);

  useEffect(() => {
    const handlePopState = () => setPortalType(resolvePortalType());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (portalType === 'dev') {
    return (
      <BrowserRouter>
        <DevPortalApp />
      </BrowserRouter>
    );
  }

  if (portalType === 'admin') {
    return (
      <BrowserRouter>
        <AdminPortalApp />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <SaasRoutes />
      <BetaFeedbackWidget />
    </BrowserRouter>
  );
}

export default App;
