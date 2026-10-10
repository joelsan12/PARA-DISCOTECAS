import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

export function SaasFaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const faqs = [
    {
      cat: 'Operación en Puerta & Emergencias',
      q: '¿Qué ocurre exactamente si se corta el internet en la discoteca a las 02:00 AM?',
      a: 'El sistema no se detiene bajo ninguna circunstancia. El personal de puerta utiliza la terminal PWA con soporte NIGHTFLOW Edge. La verificación criptográfica del pase se calcula localmente en el procesador del teléfono en 0.04 segundos. Los ingresos se guardan cifrados en el dispositivo y se sincronizan automáticamente con la consola central en cuanto la conexión a internet regresa.'
    },
    {
      cat: 'Seguridad & Anti-Fraude',
      q: '¿Cómo impide el sistema que un cliente comparta su pase por WhatsApp a varios amigos?',
      a: 'El código QR de cada pase no es una imagen estática: es un token dinámico que cambia de clave criptográfica cada 30 segundos. Si un invitado toma una captura de pantalla y se la reenvía a sus amigos, el código ya habrá expirado cuando lleguen a la puerta y el escáner del portero emitirá una alerta visual roja y sonora de rechazo.'
    },
    {
      cat: 'Finanzas & Pasarela',
      q: '¿A dónde van los anticipos de las mesas cobrados a los clientes?',
      a: 'Van directamente a la cuenta bancaria de tu empresa a través de la pasarela Kushki. NIGHTFLOW VIP nunca intermedia ni retiene tus fondos. Tú eres el único dueño de tu dinero y recibes las liquidaciones bancarias según las condiciones de tu pasarela.'
    },
    {
      cat: 'Equipos & Compatibilidad',
      q: '¿Necesitamos comprar pistolas láser, escáneres especiales o terminales costosas?',
      a: 'No. Todo el personal de seguridad y puerta utiliza cualquier teléfono inteligente convencional (Android o iPhone) con cámara funcional. La terminal se abre directamente desde el navegador web y se puede anclar a la pantalla de inicio como una aplicación nativa.'
    },
    {
      cat: 'Capacitación & Tiempos',
      q: '¿Cuánto tiempo toma cargar el plano de mi local y empezar a operar?',
      a: 'Menos de 24 horas. Nos envías un croquis, plano en PDF o foto del mapa de mesas de tu discoteca con sus capacidades y precios mínimos de consumo. Nuestro equipo dibuja el plano cenital en la plataforma y capacita a tus capitanes de meseros y guardias en una sesión rápida de 30 minutos.'
    },
    {
      cat: 'Facturación & Normativa',
      q: '¿El software cumple con los requisitos tributarios de Ecuador?',
      a: 'Sí. Los precios están estipulados en dólares estadounidenses (USD) y la plataforma contempla la emisión y registro con el 15% de IVA según las disposiciones del Servicio de Rentas Internas (SRI). Además, se apega estrictamente a la Ley Orgánica de Protección de Datos Personales (LOPDP).'
    }
  ];

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={() => setIsModalOpen(true)} />

      <main className="saas-main">
        <div className="saas-wide-shell">
          <div className="saas-page-header">
            <Link to="/software" className="saas-back-link">
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <div className="saas-badge-gold">CENTRO DE RESPUESTAS</div>
            <h1 className="saas-page-title">
              Preguntas Frecuentes &amp; Operación
            </h1>
            <p className="saas-page-lead">
              Resolvemos todas las dudas sobre el funcionamiento de NIGHTFLOW VIP en entornos reales de noche, eventos y control de aforo.
            </p>
          </div>

          <div className="saas-faq-wide-grid">
            <div className="saas-faq-accordion-list">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className="saas-faq-item">
                    <button
                      type="button"
                      className="saas-faq-question"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                    >
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--saas-gold)', fontWeight: 700, marginBottom: '4px' }}>
                          {faq.cat}
                        </span>
                        <span>{faq.q}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          color: 'var(--saas-gold)',
                          flexShrink: 0,
                          marginLeft: '12px'
                        }}
                      />
                    </button>
                    {isOpen && <div className="saas-faq-answer">{faq.a}</div>}
                  </div>
                );
              })}
            </div>

            {/* Tarjeta lateral de soporte */}
            <div className="saas-faq-support-card">
              <div className="saas-faq-support-icon">
                <HelpCircle size={28} color="var(--saas-gold)" />
              </div>
              <h3>¿Tienes una consulta específica sobre tu discoteca?</h3>
              <p>
                Escríbenos directamente para revisar la distribución de tus puertas, conectividad o integración con tu sistema de punto de venta.
              </p>
              <a
                href={`https://wa.me/593979116551?text=${encodeURIComponent('Hola, me gustaría hablar con un asesor sobre NIGHTFLOW VIP para mi discoteca.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ width: '100%', marginTop: '14px', textDecoration: 'none' }}
              >
                <MessageSquare size={15} />
                <span>Hablar con un Asesor</span>
              </a>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="saas-page-cta" style={{ marginTop: '56px' }}>
            <div>
              <h3>Listo para eliminar el caos en tu puerta este fin de semana</h3>
              <p>Postula a la beta y comienza a operar tu sala con el protocolo NIGHTFLOW VIP.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/software/simulador" className="btn-secondary" style={{ padding: '12px 22px' }}>
                Probar Simulador
              </Link>
              <button
                type="button"
                className="btn-gold"
                onClick={() => setIsModalOpen(true)}
                style={{ padding: '12px 26px' }}
              >
                <span>Solicitar Acceso Beta</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <SaasFooterBar />
      <SaasLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
