import {
  Users,
  QrCode,
  CreditCard,
  Clock,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export function SaasComparisonSection() {
  const manualItems = [
    {
      icon: Users,
      title: 'Mesas vendidas dos veces',
      desc: 'Dos promotores prometen la misma mesa VIP a clientes distintos; reclamos incómodos a medianoche.',
      tag: 'Sobreventa',
    },
    {
      icon: QrCode,
      title: 'Entradas clonadas por capturas',
      desc: 'Una foto estática o PDF se reenvía a varios grupos de amigos y entra gente gratis a tu sala.',
      tag: 'Fuga de ingresos',
    },
    {
      icon: CreditCard,
      title: 'Comprobantes falsos o cancelados',
      desc: 'Clientes que envían fotos de transferencias bancarias dudosas que nadie puede validar a tiempo.',
      tag: 'Pérdida de dinero',
    },
    {
      icon: Clock,
      title: 'Filas lentas en la entrada',
      desc: 'El portero buscando nombres en listas de papel o revisando chats uno por uno mientras la fila crece.',
      tag: '30-60s por persona',
    },
  ];

  const nightflowItems = [
    {
      icon: Lock,
      title: 'Plano con bloqueo de 12 minutos',
      desc: 'Cuando un cliente toca una mesa, el sistema la aparta en exclusiva mientras se completa el pago.',
      tag: '0% Doble venta',
    },
    {
      icon: ShieldCheck,
      title: 'Códigos QR dinámicos anti-captura',
      desc: 'El código cambia cada 30 segundos; cualquier foto o video reenviado es rechazado al instante.',
      tag: '100% Intransferible',
    },
    {
      icon: CreditCard,
      title: 'Cobro bancario directo a tu cuenta',
      desc: 'Cobros automáticos con tarjeta de crédito/débito o transferencias verificadas en tiempo real.',
      tag: 'Directo a tu banco',
    },
    {
      icon: Smartphone,
      title: 'Escaneo en 1s y avisos automáticos',
      desc: 'Lectura ultra rápida sin internet y tickets digitales con integración y avisos directos a WhatsApp.',
      tag: '0.04s en puerta',
    },
  ];

  return (
    <section className="saas-vs-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <span className="saas-vs-eyebrow">
            <span className="saas-vs-eyebrow__dot" />
            <span>Comparación Directa</span>
          </span>
          <h2 className="saas-section-title-left">
            Gestión Manual Tradicional vs <span>Automatización NIGHTFLOW</span>
          </h2>
          <p className="saas-section-desc-left">
            Compara el desorden de anotar reservas en libretas o mensajes manuales frente a un sistema profesional que automatiza tu discoteca.
          </p>
        </div>

        <div className="saas-vs-grid">
          {/* Lado Tradicional (Problemas habituales) */}
          <div className="saas-vs-card bad">
            <div className="saas-vs-card__header">
              <div className="saas-vs-card__tag bad">
                <AlertTriangle size={13} />
                <span>MÉTODO MANUAL TRADICIONAL</span>
              </div>
              <h3 className="saas-vs-card__title">Desorden, Dudas y Fricción</h3>
              <p className="saas-vs-card__sub">
                Lo que sufren gerentes, capitanes y porteros cada fin de semana usando libretas y mensajes sueltos.
              </p>
            </div>

            <div className="saas-vs-list">
              {manualItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="saas-vs-item">
                    <div className="saas-vs-icon-box">
                      <IconComponent size={18} />
                    </div>
                    <div className="saas-vs-item-body">
                      <div className="saas-vs-item-header">
                        <h4 className="saas-vs-item-title">{item.title}</h4>
                        <span className="saas-vs-pill">{item.tag}</span>
                      </div>
                      <p className="saas-vs-item-desc">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lado NIGHTFLOW VIP (Solución automatizada de alta gama) */}
          <div className="saas-vs-card good">
            <div className="saas-vs-card__header">
              <div className="saas-vs-card__tag good">
                <Sparkles size={13} />
                <span>CON NIGHTFLOW VIP (AUTOMATIZADO)</span>
              </div>
              <h3 className="saas-vs-card__title">Control Total, Rapidez y Prestigio</h3>
              <p className="saas-vs-card__sub">
                Toda la operación sincronizada al instante entre tu plano en vivo, tu banco y el personal de puerta.
              </p>
            </div>

            <div className="saas-vs-list">
              {nightflowItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="saas-vs-item">
                    <div className="saas-vs-icon-box">
                      <IconComponent size={18} />
                    </div>
                    <div className="saas-vs-item-body">
                      <div className="saas-vs-item-header">
                        <h4 className="saas-vs-item-title">{item.title}</h4>
                        <span className="saas-vs-pill">{item.tag}</span>
                      </div>
                      <p className="saas-vs-item-desc">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
