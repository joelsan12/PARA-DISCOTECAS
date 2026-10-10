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

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={openModal} />

      <main className="saas-main">
        {/* 1. Hero Asimétrico: Pantalla completa inicial */}
        <SaasHeroSection onOpenModal={openModal} />

        {/* 2. Experiencias de Sala en Producción: Pantalla completa en scroll */}
        <SaasExperiencesSection />

        {/* 3. Comparativa Operativa Directa: Pantalla completa en scroll */}
        <SaasComparisonSection />

        {/* 4. Cierre: Banner de Registro y Footer */}
        <section className="saas-closing-screen">
          <SaasCtaBanner onOpenModal={openModal} />
          <SaasFooterBar />
        </section>
      </main>

      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
