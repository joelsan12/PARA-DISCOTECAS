import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Lock,
  ArrowRight,
  Cpu,
  Layers,
} from 'lucide-react';

type TableKey = 'suite' | 'dj' | 'palco';

interface TableData {
  id: TableKey;
  name: string;
  desc: string;
  status: 'AVAILABLE' | 'HELD' | 'OCCUPIED';
  timer: number;
}

const INITIAL_EXPERIENCE_TABLES: Record<TableKey, TableData> = {
  suite: {
    id: 'suite',
    name: 'Suite VIP 01',
    desc: '15 personas · $120 anticipo',
    status: 'AVAILABLE',
    timer: 720,
  },
  dj: {
    id: 'dj',
    name: 'Cabina DJ VIP',
    desc: '12 personas · $150 anticipo',
    status: 'OCCUPIED',
    timer: 0,
  },
  palco: {
    id: 'palco',
    name: 'Palco Escenario',
    desc: '10 personas · $90 anticipo',
    status: 'AVAILABLE',
    timer: 720,
  },
};

export function SaasExperiencesSection() {
  const [selectedTable, setSelectedTable] = useState<TableKey>('suite');
  const [tables, setTables] = useState<Record<TableKey, TableData>>(INITIAL_EXPERIENCE_TABLES);

  // Temporizador de hold para cualquier mesa en estado HELD
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

  const currentTable = tables[selectedTable];

  return (
    <section className="saas-experiences-section saas-fullscreen-section">
      <div className="saas-wide-shell">
        <div className="saas-section-header-left">
          <span className="saas-badge-gold">CÓMO FUNCIONA EN TU DISCOTECA</span>
          <h2 className="saas-section-title-left">Controla tu noche en 3 pasos muy sencillos</h2>
          <p className="saas-section-desc-left">
            Olvídate de las listas impresas, las discusiones en la entrada y el caos de coordinar reservas por chats.
          </p>
        </div>

        <div className="saas-experience-grid">
          {/* Experiencia 1: El Plano Cenital Interactivo */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <MapPin size={14} color="var(--saas-gold)" />
                <span>01 // RESERVAS POR INTERNET</span>
              </div>
              <h3>Mapa de Mesas y Pago Inmediato</h3>
              <p>
                Tus clientes eligen su mesa favorita y pagan el anticipo directo a tu cuenta. El sistema aparta la mesa 12 minutos para que nadie más la tome mientras completan el pago.
              </p>
            </div>

            {/* Micro-simulador de mesa dentro de la tarjeta */}
            <div className="saas-micro-floor">
              <div className="saas-micro-table-row">
                {(Object.keys(tables) as TableKey[]).map((key) => {
                  const t = tables[key];
                  const isSelected = selectedTable === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`saas-micro-table ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedTable(key)}
                    >
                      <div className="saas-micro-table__info">
                        <strong>{t.name}</strong>
                        <span>{t.desc}</span>
                      </div>
                      <span className={`saas-table-pill ${t.status === 'HELD' ? 'held' : t.status === 'OCCUPIED' ? 'occ' : 'avail'}`}>
                        {t.status === 'HELD'
                          ? `APARTADA ${Math.floor(t.timer / 60)}:${(t.timer % 60).toString().padStart(2, '0')}`
                          : t.status === 'OCCUPIED'
                          ? 'OCUPADA'
                          : 'DISPONIBLE'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="saas-micro-floor__action">
                <button
                  type="button"
                  className="btn-gold"
                  onClick={() => handleToggleHold(selectedTable)}
                  style={{ fontSize: '0.76rem', padding: '8px 14px' }}
                >
                  <Lock size={13} />
                  <span>
                    {currentTable.status === 'AVAILABLE'
                      ? 'Simular Reserva (Apartar 12 min)'
                      : currentTable.status === 'HELD'
                      ? `Liberar ${currentTable.name}`
                      : 'Liberar Mesa Ocupada'}
                  </span>
                </button>
                <span style={{ fontSize: '0.74rem', color: 'var(--saas-text-secondary)' }}>
                  {currentTable.status === 'HELD'
                    ? `${currentTable.name} apartada: nadie más puede comprarla.`
                    : currentTable.status === 'OCCUPIED'
                    ? 'Esta mesa está ocupada. Puedes liberarla para probar apartarla.'
                    : `Toca el botón para ver cómo se aparta ${currentTable.name}.`}
                </span>
              </div>
            </div>

            <Link to="/software/simulador" className="saas-card-link">
              <span>Probar el mapa de mesas en vivo</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Experiencia 2: La Puerta Offline a las 02:00 AM */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <Cpu size={14} color="var(--saas-gold)" />
                <span>02 // CONTROL EN LA PUERTA</span>
              </div>
              <h3>Escáner Rápido que Funciona sin Internet</h3>
              <p>
                Tus porteros escanean las entradas con la cámara de su teléfono en menos de un segundo. Aunque tu local esté en un subsuelo o falle el internet, la fila avanza sin parar.
              </p>
            </div>

            {/* Vista HUD del escáner en puerta */}
            <div className="saas-micro-hud">
              <div className="saas-micro-hud__header">
                <span style={{ color: '#34d399', fontWeight: 700 }}>● ESCÁNER DE ENTRADA // PUERTA 01</span>
                <span>TIEMPO: AL INSTANTE</span>
              </div>
              <div className="saas-micro-hud__body">
                <div className="saas-micro-hud__line">
                  <span>RESERVA:</span>
                  <strong>#RES-8921-SENSORIAL</strong>
                </div>
                <div className="saas-micro-hud__line">
                  <span>ESTADO:</span>
                  <strong style={{ color: '#34d399' }}>✓ ENTRADA AUTÉNTICA · ACCESO APROBADO</strong>
                </div>
                <div className="saas-micro-hud__line">
                  <span>CONEXIÓN:</span>
                  <span style={{ color: 'var(--saas-gold)' }}>FUNCIONA SIN INTERNET · SE GUARDA EN EL TELÉFONO</span>
                </div>
              </div>
            </div>

            <Link to="/software/arquitectura" className="saas-card-link">
              <span>Ver cómo opera la seguridad sin internet</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Experiencia 3: Consola de Sala en Vivo */}
          <div className="saas-exp-card">
            <div className="saas-exp-card__head">
              <div className="saas-exp-tag">
                <Layers size={14} color="var(--saas-gold)" />
                <span>03 // CONTROL DE TU DINERO</span>
              </div>
              <h3>Panel en Vivo para el Gerente y la Barra</h3>
              <p>
                Mira en tiempo real desde tu celular o computadora cuántas mesas están ocupadas, cuánto dinero ha entrado por anticipos y cuánta gente está en la sala.
              </p>
            </div>

            {/* Previsualización de la consola */}
            <div className="saas-micro-dashboard-preview">
              <div className="saas-micro-kpi-row">
                <div className="saas-micro-kpi">
                  <span>MESAS OCUPADAS</span>
                  <strong>28 / 30</strong>
                </div>
                <div className="saas-micro-kpi">
                  <span>ANTICIPOS COBRADOS</span>
                  <strong style={{ color: 'var(--saas-gold)' }}>$2,840 USD</strong>
                </div>
                <div className="saas-micro-kpi">
                  <span>CLIENTES EN SALA</span>
                  <strong>342 PERSONAS</strong>
                </div>
              </div>
            </div>

            <Link to="/software/pantallas" className="saas-card-link">
              <span>Ver las pantallas del personal y clientes</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
