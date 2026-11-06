import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SaasAmbient, SaasFooter, SaasHeader } from './saas-ui';
import { SaasDirectoryPage } from './SaasDirectoryPage';

const SaasLandingPage = lazy(() =>
  import('./SaasLandingPage').then((m) => ({ default: m.SaasLandingPage })),
);
const SaasSimulatorPage = lazy(() =>
  import('./SaasSimulatorPage').then((m) => ({ default: m.SaasSimulatorPage })),
);
const SaasArchitecturePage = lazy(() =>
  import('./SaasArchitecturePage').then((m) => ({ default: m.SaasArchitecturePage })),
);
const SaasScreensPage = lazy(() =>
  import('./SaasScreensPage').then((m) => ({ default: m.SaasScreensPage })),
);
const SaasFaqPage = lazy(() =>
  import('./SaasFaqPage').then((m) => ({ default: m.SaasFaqPage })),
);
const BusinessBrandPage = lazy(() =>
  import('./BusinessBrandPage').then((m) => ({ default: m.BusinessBrandPage })),
);
const BusinessAccessPage = lazy(() =>
  import('./BusinessAccessPage').then((m) => ({ default: m.BusinessAccessPage })),
);
const BusinessPortalPage = lazy(() =>
  import('./BusinessPortalPage').then((m) => ({ default: m.BusinessPortalPage })),
);
const ClientPortalApp = lazy(() =>
  import('../client/ClientPortalApp').then((m) => ({ default: m.ClientPortalApp })),
);

function SaasNotFound() {
  return (
    <div className="saas-app saas-simple-page">
      <SaasAmbient />
      <SaasHeader />
      <main className="saas-container saas-simple-page__content">
        <span className="saas-404-code">404 / NIGHTFLOW</span>
        <h1>La ruta no está en la agenda.</h1>
        <p>Vuelve al directorio y encuentra una experiencia con tu nombre.</p>
        <Link className="saas-button saas-button--gold" to="/"><ArrowLeft size={16} /> Volver al directorio</Link>
      </main>
      <SaasFooter />
    </div>
  );
}

export function SaasRoutes() {
  return (
    <Suspense fallback={<div className="saas-route-fallback" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<SaasDirectoryPage />} />
        <Route path="/negocios" element={<SaasDirectoryPage />} />
        <Route path="/software" element={<SaasLandingPage />} />
        <Route path="/software/simulador" element={<SaasSimulatorPage />} />
        <Route path="/software/arquitectura" element={<SaasArchitecturePage />} />
        <Route path="/software/pantallas" element={<SaasScreensPage />} />
        <Route path="/software/planes" element={<Navigate to="/software" replace />} />
        <Route path="/software/faq" element={<SaasFaqPage />} />

        {/* Aliases directos */}
        <Route path="/simulador" element={<SaasSimulatorPage />} />
        <Route path="/arquitectura" element={<SaasArchitecturePage />} />
        <Route path="/pantallas" element={<SaasScreensPage />} />
        <Route path="/planes" element={<Navigate to="/software" replace />} />
        <Route path="/faq" element={<SaasFaqPage />} />
        <Route path="/saas" element={<SaasLandingPage />} />
        <Route path="/landing" element={<SaasLandingPage />} />
        <Route path="/para-clubes" element={<SaasLandingPage />} />
        <Route path="/beta" element={<SaasLandingPage />} />
        <Route path="/activar" element={<SaasLandingPage />} />

        <Route path="/negocio/:slug" element={<BusinessBrandPage />} />
        <Route path="/negocio/:slug/acceso" element={<BusinessAccessPage />} />
        <Route path="/negocio/:slug/app" element={<BusinessPortalPage />} />
        <Route path="/app" element={<ClientPortalApp />} />
        <Route path="/portal" element={<ClientPortalApp />} />
        <Route path="*" element={<SaasNotFound />} />
      </Routes>
    </Suspense>
  );
}

export function SaasApp() {
  return (
    <BrowserRouter>
      <SaasRoutes />
    </BrowserRouter>
  );
}

export default SaasApp;
