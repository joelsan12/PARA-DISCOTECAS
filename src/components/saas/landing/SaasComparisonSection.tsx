import { useState } from 'react';

interface ContrastPair {
  problem: string;
  problemDesc: string;
  solution: string;
  solutionDesc: string;
}

const CONTRASTS: ContrastPair[] = [
  {
    problem: 'Promotores prometiendo la misma mesa',
    problemDesc:
      'Dos promotores venden la misma mesa VIP a clientes distintos y el reclamo llega a medianoche.',
    solution: 'Plano con bloqueo automático de 12 minutos',
    solutionDesc:
      'El primer cliente que toca la mesa la bloquea para él mientras paga; nadie más puede venderla.',
  },
  {
    problem: 'Capturas reenviadas por WhatsApp',
    problemDesc:
      'Una foto del código se reenvía a varios grupos y entra gente que no pagó a tu sala.',
    solution: 'Códigos dinámicos que caducan en 30 segundos',
    solutionDesc:
      'El código cambia solo; una captura vieja se rechaza en la puerta al instante.',
  },
  {
    problem: 'Comprobantes de transferencia dudosos',
    problemDesc:
      'Fotos de transferencias que nadie valida a tiempo y terminan en mesas sin pagar.',
    solution: 'Anticipo verificado directo a tu cuenta',
    solutionDesc:
      'El pago se confirma solo antes de confirmar la mesa; el dinero llega a tu cuenta.',
  },
  {
    problem: 'Listas de papel y fila frenada',
    problemDesc:
      'El portero buscando nombres en libretas y chats mientras la fila crece afuera.',
    solution: 'Escáner que funciona sin internet',
    solutionDesc:
      'El pase se lee al instante y la fila sigue avanzando aunque se caiga la conexión.',
  },
];

export function SaasComparisonSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const renderItem = (pair: ContrastPair, index: number, side: 'problem' | 'solution') => {
    const title = side === 'problem' ? pair.problem : pair.solution;
    const desc = side === 'problem' ? pair.problemDesc : pair.solutionDesc;
    return (
      <button
        key={title}
        type="button"
        className={`saas-vs-item ${activeIndex === index ? 'is-active' : ''}`}
        onMouseEnter={() => setActiveIndex(index)}
        onMouseLeave={() => setActiveIndex(null)}
        onFocus={() => setActiveIndex(index)}
        onBlur={() => setActiveIndex(null)}
        onClick={() => setActiveIndex(index)}
      >
        <span className="saas-vs-item__index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="saas-vs-item__body">
          <span className="saas-vs-item__title">{title}</span>
          <span className="saas-vs-item__desc">{desc}</span>
        </span>
      </button>
    );
  };

  return (
    <section className="saas-vs-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <span className="saas-vs-eyebrow">
            <span className="saas-vs-eyebrow__dot" aria-hidden="true" />
            <span>COMPARACIÓN DIRECTA</span>
          </span>
          <h2 className="saas-section-title-left">
            El desorden de las 02:00 AM vs{' '}
            <span className="saas-vs-title-accent">el control de tu sala.</span>
          </h2>
          <p className="saas-section-desc-left">
            Cuatro problemas que todas las discotecas viven cada sábado, y la respuesta
            directa que tiene tu equipo con NIGHTFLOW.
          </p>
        </div>

        <div className="saas-vs-grid">
          {/* Columna izquierda: la noche tradicional */}
          <div className="saas-vs-column saas-vs-column--manual">
            <div className="saas-vs-column__head">
              <span className="saas-vs-column__label">LA NOCHE TRADICIONAL</span>
              <h3 className="saas-vs-column__title">Lo que sale mal</h3>
              <p className="saas-vs-column__sub">
                Lo que sufren gerentes, capitanes y porteros cada fin de semana con libretas
                y mensajes sueltos.
              </p>
            </div>
            <div className="saas-vs-list">
              {CONTRASTS.map((pair, index) => renderItem(pair, index, 'problem'))}
            </div>
          </div>

          {/* Columna derecha: la noche con NIGHTFLOW */}
          <div className="saas-vs-column saas-vs-column--nightflow">
            <div className="saas-vs-column__head">
              <span className="saas-vs-column__label">LA NOCHE CON NIGHTFLOW</span>
              <h3 className="saas-vs-column__title">La respuesta directa</h3>
              <p className="saas-vs-column__sub">
                Cada punto de fricción resuelto en el mismo momento en que ocurre.
              </p>
            </div>
            <div className="saas-vs-list">
              {CONTRASTS.map((pair, index) => renderItem(pair, index, 'solution'))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
