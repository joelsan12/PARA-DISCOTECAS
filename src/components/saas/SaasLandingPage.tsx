import { useState } from 'react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import {
  SaasHeroSection,
  SaasExperiencesSection,
  SaasComparisonSection,
  SaasCtaBanner,
} from './landing';
import '../../styles/saas-landing/index.css';

export function SaasLandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openLeadModal = (_plan?: string) => {
    setIsModalOpen(true);
  };

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={openLeadModal} />

      <main className="saas-main">
        {/* 1. Hero Asimétrico: Pantalla completa inicial con Pase VIP limpio */}
        <SaasHeroSection onOpenModal={openLeadModal} />

        {/* 2. Experiencias de Sala y Núcleo de Mesas */}
        <SaasExperiencesSection />

        {/* 3. Comparativa Operativa Directa */}
        <SaasComparisonSection />

        {/* 4. Cierre: Solicitud de Onboarding Privado */}
        <section className="saas-closing-screen">
          <SaasCtaBanner onOpenModal={openLeadModal} />
        </section>
      </main>

      {/* 5. Footer Operativo y de Cumplimiento */}
      <SaasFooterBar />

      {/* Modal de Solicitud de Onboarding / Plan */}
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
