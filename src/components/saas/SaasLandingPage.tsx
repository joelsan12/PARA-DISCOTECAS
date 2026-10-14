import { useState, useEffect } from 'react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import {
  SaasHeroSection,
  SaasBetaTeaserBanner,
  SaasBetaWelcomeModal,
  SaasExperiencesSection,
  SaasComparisonSection,
  SaasCtaBanner,
} from './landing';
import '../../styles/saas-landing/index.css';

export function SaasLandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBetaWelcomeOpen, setIsBetaWelcomeOpen] = useState(false);

  // Al ingresar, aparecer automáticamente el entorno interactivo de prueba beta
  useEffect(() => {
    try {
      const hasSeenModal = sessionStorage.getItem('nightflow_beta_modal_seen');
      if (!hasSeenModal) {
        // Retardo elegante de 650ms para permitir que la animación del hero cargue primero
        const timer = setTimeout(() => {
          setIsBetaWelcomeOpen(true);
        }, 650);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback seguro si sessionStorage está bloqueado
      const timer = setTimeout(() => {
        setIsBetaWelcomeOpen(true);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, []);

  const openLeadModal = (_plan?: string) => {
    setIsModalOpen(true);
  };

  const openBetaWelcomeModal = () => {
    setIsBetaWelcomeOpen(true);
  };

  const closeBetaWelcomeModal = () => {
    setIsBetaWelcomeOpen(false);
    try {
      sessionStorage.setItem('nightflow_beta_modal_seen', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div className="saas-page">
      <SaasNavbar
        onOpenModal={openLeadModal}
        onOpenBetaModal={openBetaWelcomeModal}
      />

      <main className="saas-main">
        {/* 1. Hero Asimétrico: Pantalla completa inicial */}
        <SaasHeroSection onOpenModal={openLeadModal} />

        {/* 2. Banner Teaser de Acceso Rápido a la Beta */}
        <SaasBetaTeaserBanner onOpenBetaModal={openBetaWelcomeModal} />

        {/* 3. Experiencias de Sala en Producción: Pantalla completa en scroll */}
        <SaasExperiencesSection />

        {/* 4. Comparativa Operativa Directa: Pantalla completa en scroll */}
        <SaasComparisonSection />

        {/* 5. Cierre: Banner de Registro */}
        <section className="saas-closing-screen">
          <SaasCtaBanner onOpenModal={openLeadModal} />
        </section>
      </main>

      {/* 6. Footer Operativo y de Cumplimiento */}
      <SaasFooterBar />

      {/* Modal Interactivo de Entrada a la Beta (aparece al entrar y se puede cerrar libremente) */}
      <SaasBetaWelcomeModal
        isOpen={isBetaWelcomeOpen}
        onClose={closeBetaWelcomeModal}
      />

      {/* Modal de Solicitud de Onboarding / Plan */}
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
