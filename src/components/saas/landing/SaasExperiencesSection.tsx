import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type TableKey = 'suite' | 'dj' | 'palco';

interface TableData {
  id: TableKey;
  name: string;
  pax: number;
  minSpend: number;
  status: 'AVAILABLE' | 'HELD' | 'OCCUPIED';
  timer: number;
}

const INITIAL_EXPERIENCE_TABLES: Record<TableKey, TableData> = {
  suite: {
    id: 'suite',
    name: 'Suite Privé 01',
    pax: 15,
    minSpend: 380,
    status: 'HELD',
    timer: 684,
  },
  dj: {
    id: 'dj',
    name: 'Cabina DJ VIP',
    pax: 12,
    minSpend: 250,
    status: 'OCCUPIED',
    timer: 0,
  },
  palco: {
    id: 'palco',
    name: 'Palco Imperial',
    pax: 10,
    minSpend: 200,
    status: 'AVAILABLE',
    timer: 720,
  },
};

export function SaasExperiencesSection() {
  const [selectedTable, setSelectedTable] = useState<TableKey>('suite');
  const [tables, setTables] = useState<Record<TableKey, TableData>>(INITIAL_EXPERIENCE_TABLES);

  // Temporizador de hold para cualquier mesa apartada
  useEffect(() => {
    const timer = setInterval(() => {
      setTables((prev) => {
        let hasHeld = false;
        const updated = { ...prev };
        for (const key of Object.keys(updated) as TableKey[]) {
          if (updated[key].status === 'HELD') {
            hasHeld = true;
            const nextTime = updated[key].timer > 0 ? updated[key].timer - 1 : 720;
            updated[key] = { ...updated[key], timer: nextTime };
          }
        }
        return hasHeld ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleHold = (key: TableKey) => {
    setSelectedTable(key);
    setTables((prev) => {
      const current = prev[key];
      if (current.status === 'AVAILABLE') {
        return {
          ...prev,
          [key]: { ...current, status: 'HELD', timer: 720 },
        };
      }
      if (current.status === 'HELD') {
        return {
          ...prev,
          [key]: { ...current, status: 'AVAILABLE', timer: 720 },
        };
      }
      if (current.status === 'OCCUPIED') {
        return {
          ...prev,
          [key]: { ...current, status: 'AVAILABLE', timer: 720 },
        };
      }
      return prev;
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section className="saas-experiences-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <div className="saas-section-eyebrow">
            <span className="saas-section-eyebrow-dot" aria-hidden="true" />
            <span>ARQUITECTURA OPERATIVA // TRES MOVIMIENTOS</span>
          </div>
          <h2 className="saas-section-title-left">
            Control total de tu noche en 3 movimientos.
          </h2>
          <p className="saas-section-desc-left">
            La venta anticipada, la puerta en hora pico y la barra de consumos sincronizadas en una sola arquitectura sin fricción ni caídas.
          </p>
        </div>

        <div className="saas-experience-grid">
          {/* Pilar 1: Reserva Cenital en Vivo */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <MapPin size={13} />
                <span>01 // VENTA EN LÍNEA</span>
              </div>
              <h3 className="saas-exp-card__title">Plano Cenital &amp; Anticipo Inmediato</h3>
              <p className="saas-exp-card__desc">
                Tus clientes tocan su mesa favorita y pagan el anticipo al instante. La mesa se bloquea 12 minutos con un hold atómico en servidor: cero sobreventa a medianoche.
              </p>
            </div>

            {/* Micro visualizador interactivo del plano */}
            <div className="saas-micro-floor-pillar">
              <div className="saas-micro-floor-tiles">
                {(Object.keys(tables) as TableKey[]).map((key) => {
                  const t = tables[key];
                  const isSelected = selectedTable === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggleHold(key)}
                      className={`saas-pillar-table-tile ${t.status.toLowerCase()} ${
                        isSelected ? 'selected' : ''
                      }`}
                    >
                      <div className="saas-pillar-table-main">
                        <span className="saas-pillar-table-name">{t.name}</span>
                        <span className="saas-pillar-table-meta">{t.pax} pax · Min. ${t.minSpend}</span>
                      </div>
                      <div className="saas-pillar-table-status">
                        {t.status === 'HELD' && (
                          <span className="saas-pillar-held-time">
                            <Clock size={11} />
                            <span>{formatTimer(t.timer)}</span>
                          </span>
                        )}
                        {t.status === 'AVAILABLE' && (
                          <span className="saas-pillar-status-text avail">
                            <span className="saas-pillar-dot avail" /> LIBRE
                          </span>
                        )}
                        {t.status === 'OCCUPIED' && (
                          <span className="saas-pillar-status-text occ">
                            <span className="saas-pillar-dot occ" /> EN SALA
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="saas-pillar-note">
                <span className="saas-pillar-note-dot" />
                <span>Toca una mesa para probar el bloqueo atómico de 12 minutos.</span>
              </div>
            </div>

            <Link to="/software/simulador" className="saas-card-link">
              <span>Explorar simulador de reservas</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Pilar 2: Control Criptográfico en Puerta */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <Cpu size={13} />
                <span>02 // CONTROL DE PUERTA</span>
              </div>
              <h3 className="saas-exp-card__title">Escáner Óptico Sin Internet</h3>
              <p className="saas-exp-card__desc">
                Validación por hardware con la cámara de cualquier teléfono móvil en menos de 50 ms. Aunque el local esté en un subsuelo o falle el internet, la fila avanza sin detenerse.
              </p>
            </div>

            {/* Micro HUD Óptico */}
            <div className="saas-micro-hud-pillar">
              <div className="saas-hud-telemetry-header">
                <div className="saas-hud-title-line">
                  <span className="saas-hud-live-dot" />
                  <span>TERMINAL PUERTA 01 · KMS ED25519</span>
                </div>
                <span className="saas-hud-latency">&lt; 0.04s SLA</span>
              </div>

              <div className="saas-hud-data-lines">
                <div className="saas-hud-row">
                  <span className="saas-hud-label">CREDENCIAL:</span>
                  <span className="saas-hud-value mono">#RES-8921-SENSORIAL</span>
                </div>
                <div className="saas-hud-row verified">
                  <span className="saas-hud-label">VEREDICTO:</span>
                  <span className="saas-hud-value success">
                    <CheckCircle2 size={13} />
                    <span>ENTRADA AUTÉNTICA · ACCESO PERMITIDO</span>
                  </span>
                </div>
                <div className="saas-hud-row">
                  <span className="saas-hud-label">CONECTIVIDAD:</span>
                  <span className="saas-hud-value gold">RED LOCAL AISLADA · CERO DEPENDENCIAS</span>
                </div>
              </div>
            </div>

            <Link to="/software/arquitectura" className="saas-card-link">
              <span>Conocer la seguridad sin internet</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Pilar 3: Consola de Sala & Liquidación */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <Layers size={13} />
                <span>03 // CONTROL DE SALA</span>
              </div>
              <h3 className="saas-exp-card__title">Mando en Vivo para Gerencia y Barra</h3>
              <p className="saas-exp-card__desc">
                Monitorea aforo en tiempo real, consumos cargados a la mesa y recaudación de anticipos bancarios directos a tu cuenta con respaldo y facturación SRI al instante.
              </p>
            </div>

            {/* Micro Dashboard de KPIs */}
            <div className="saas-micro-kpi-pillar">
              <div className="saas-pillar-kpi-grid">
                <div className="saas-pillar-kpi-cell">
                  <span className="saas-pillar-kpi-label">AFORO EN SALA</span>
                  <strong className="saas-pillar-kpi-val">214 / 300</strong>
                  <div className="saas-pillar-kpi-bar">
                    <span className="saas-pillar-kpi-fill" style={{ width: '71%' }} />
                  </div>
                </div>
                <div className="saas-pillar-kpi-cell">
                  <span className="saas-pillar-kpi-label">ANTICIPOS COBRADOS</span>
                  <strong className="saas-pillar-kpi-val gold">$2,840 USD</strong>
                  <span className="saas-pillar-kpi-sub">Directo a tu cuenta</span>
                </div>
              </div>

              <div className="saas-pillar-kpi-status-line">
                <span className="saas-pillar-dot avail" />
                <span>Barra y Terminales de Meseros sincronizadas al segundo</span>
              </div>
            </div>

            <Link to="/software/pantallas" className="saas-card-link">
              <span>Ver pantallas de personal y clientes</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
