import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, RotateCcw } from 'lucide-react';

type ZoneKey = 'palcos' | 'vip' | 'pista';
type TableStatus = 'AVAILABLE' | 'HELD' | 'OCCUPIED';

interface TableData {
  id: string;
  name: string;
  zone: ZoneKey;
  pax: number;
  minSpend: number;
  status: TableStatus;
  timer: number;
}

const HOLD_SECONDS = 12 * 60;

const INITIAL_TABLES: TableData[] = [
  { id: 'palco-norte', name: 'Palco Norte', zone: 'palcos', pax: 10, minSpend: 200, status: 'AVAILABLE', timer: HOLD_SECONDS },
  { id: 'palco-sur', name: 'Palco Sur', zone: 'palcos', pax: 12, minSpend: 240, status: 'AVAILABLE', timer: HOLD_SECONDS },
  { id: 'suite-01', name: 'Suite Privé 01', zone: 'vip', pax: 15, minSpend: 380, status: 'OCCUPIED', timer: 0 },
  { id: 'suite-02', name: 'Suite Privé 02', zone: 'vip', pax: 12, minSpend: 300, status: 'AVAILABLE', timer: HOLD_SECONDS },
  { id: 'pista-01', name: 'Mesa Pista 01', zone: 'pista', pax: 8, minSpend: 90, status: 'AVAILABLE', timer: HOLD_SECONDS },
];

const formatTimer = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const STATUS_LABEL: Record<TableStatus, string> = {
  AVAILABLE: 'LIBRE',
  HELD: 'BLOQUEADA',
  OCCUPIED: 'EN SALA',
};

export function SaasExperiencesSection() {
  const [tables, setTables] = useState<TableData[]>(INITIAL_TABLES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_TABLES[0].id);

  // Cuenta regresiva del bloqueo de 12 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setTables((prev) => {
        if (!prev.some((t) => t.status === 'HELD')) return prev;
        return prev.map((t) => {
          if (t.status !== 'HELD') return t;
          if (t.timer > 1) return { ...t, timer: t.timer - 1 };
          // El hold vence y la mesa vuelve a estar a la venta
          return { ...t, status: 'AVAILABLE' as TableStatus, timer: HOLD_SECONDS };
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTableClick = (table: TableData) => {
    setSelectedId(table.id);
    if (table.status !== 'AVAILABLE') return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id ? { ...t, status: 'HELD' as TableStatus, timer: HOLD_SECONDS } : t,
      ),
    );
  };

  const handleReset = () => {
    setTables(INITIAL_TABLES);
    setSelectedId(INITIAL_TABLES[0].id);
  };

  const selected = tables.find((t) => t.id === selectedId) ?? tables[0];
  const heldCount = tables.filter((t) => t.status === 'HELD').length;

  const renderTile = (table: TableData) => {
    const isSelected = selectedId === table.id;
    const stateClass =
      table.status === 'HELD'
        ? 'is-held'
        : table.status === 'OCCUPIED'
          ? 'is-occupied'
          : 'is-free';
    return (
      <button
        key={table.id}
        type="button"
        onClick={() => handleTableClick(table)}
        aria-pressed={isSelected}
        className={`saas-floor-tile ${stateClass} ${isSelected ? 'is-selected' : ''}`}
      >
        <span className="saas-floor-tile__name">{table.name}</span>
        <span className="saas-floor-tile__meta">
          {table.pax} pax · mín. ${table.minSpend}
        </span>
        <span className={`saas-floor-tile__state ${stateClass}`}>
          {table.status === 'HELD' && (
            <>
              <Clock size={11} aria-hidden="true" />
              <span>{formatTimer(table.timer)}</span>
            </>
          )}
          {table.status !== 'HELD' && <span>{STATUS_LABEL[table.status]}</span>}
        </span>
      </button>
    );
  };

  const renderZone = (zone: ZoneKey, label: string) => (
    <div className={`saas-floor-zone ${zone === 'pista' ? 'saas-floor-zone--pista' : ''}`}>
      <span className="saas-floor-zone__label">{label}</span>
      <div className="saas-floor-zone__tables">
        {tables.filter((t) => t.zone === zone).map(renderTile)}
      </div>
    </div>
  );

  return (
    <section className="saas-experiences-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <div className="saas-section-eyebrow">
            <span className="saas-section-eyebrow-dot" aria-hidden="true" />
            <span>VENTA DE MESAS EN VIVO</span>
          </div>
          <h2 className="saas-section-title-left">
            El fin de las mesas vendidas dos veces.
          </h2>
          <p className="saas-section-desc-left">
            Cuando un cliente toca una mesa, queda bloqueada por 12 minutos para él. Nadie
            más puede comprarla mientras el pago se procesa.
          </p>
        </div>

        <div className="saas-experience-grid">
          {/* Plano cenital de la sala */}
          <div className="saas-floor-plan">
            <div className="saas-floor-plan__head">
              <span className="saas-floor-plan__title">Plano de la sala</span>
              <div className="saas-floor-legend" aria-hidden="true">
                <span className="saas-floor-legend__item is-free">LIBRE</span>
                <span className="saas-floor-legend__item is-held">BLOQUEADA</span>
                <span className="saas-floor-legend__item is-occupied">EN SALA</span>
              </div>
            </div>

            <div className="saas-floor-zones" aria-label="Plano de mesas del club">
              {renderZone('palcos', 'PALCOS')}
              {renderZone('vip', 'ZONA VIP')}
              <div className="saas-floor-zone saas-floor-zone--pista">
                <span className="saas-floor-zone__label">PISTA</span>
                <div className="saas-floor-pista-body">
                  <div className="saas-floor-dancefloor" aria-hidden="true" />
                  <div className="saas-floor-zone__tables">
                    {tables.filter((t) => t.zone === 'pista').map(renderTile)}
                  </div>
                </div>
              </div>
            </div>

            <div className="saas-floor-footnote">
              <span className="saas-floor-note-dot" aria-hidden="true" />
              <p>
                Toca una mesa libre: se bloquea al instante y nadie más puede comprarla
                durante 12 minutos.
              </p>
              <button type="button" className="saas-floor-reset" onClick={handleReset}>
                <RotateCcw size={12} aria-hidden="true" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Visor de liquidación y control */}
          <aside className="saas-floor-panel">
            <div className="saas-floor-panel__head">
              <span className="saas-floor-panel__label">LIQUIDACIÓN</span>
              <span className="saas-floor-panel__count">
                {heldCount} {heldCount === 1 ? 'BLOQUEADA' : 'BLOQUEADAS'}
              </span>
            </div>

            <h3 className="saas-floor-panel__table">{selected.name}</h3>

            <div className="saas-panel-rows">
              <div className="saas-panel-row">
                <span className="saas-panel-row__label">Aforo</span>
                <span className="saas-panel-row__value">{selected.pax} personas</span>
              </div>
              <div className="saas-panel-row">
                <span className="saas-panel-row__label">Mínimo de mesa</span>
                <span className="saas-panel-row__value">${selected.minSpend}</span>
              </div>
              <div className="saas-panel-row">
                <span className="saas-panel-row__label">Estado</span>
                <span className={`saas-panel-row__value is-${selected.status.toLowerCase()}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>
            </div>

            {selected.status === 'HELD' && (
              <div className="saas-panel-hold">
                <span className="saas-panel-hold__label">
                  BLOQUEADA PARA ESTE CLIENTE
                </span>
                <span className="saas-panel-hold__timer">
                  {formatTimer(selected.timer)}
                </span>
                <p className="saas-panel-hold__text">
                  Nadie más puede comprarla mientras el pago se procesa. Si el pago falla,
                  la mesa vuelve a estar a la venta.
                </p>
              </div>
            )}

            {selected.status === 'AVAILABLE' && (
              <p className="saas-panel-hint">
                Toca una mesa del plano para bloquearla al instante durante 12 minutos.
              </p>
            )}

            {selected.status === 'OCCUPIED' && (
              <p className="saas-panel-hint">
                Esta mesa ya está ocupada y no está a la venta esta noche.
              </p>
            )}

            <Link to="/software/simulador" className="saas-card-link">
              <span>Explorar simulador de reservas</span>
              <ArrowRight size={14} />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
