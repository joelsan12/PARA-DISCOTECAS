import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BusinessAccessPage } from './BusinessAccessPage';
import { BusinessBrandPage } from './BusinessBrandPage';
import { BusinessPortalPage } from './BusinessPortalPage';
import { SaasDirectoryPage } from './SaasDirectoryPage';
import { SaasAmbient, SaasFooter, SaasHeader } from './saas-ui';
import { SaasLandingPage } from './SaasLandingPage';
import { SaasSimulatorPage } from './SaasSimulatorPage';
import { SaasArchitecturePage } from './SaasArchitecturePage';
import { SaasScreensPage } from './SaasScreensPage';
import { SaasFaqPage } from './SaasFaqPage';
import { ClientPortalApp } from '../client/ClientPortalApp';

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
