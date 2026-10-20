import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  RotateCw,
  Zap,
  CreditCard,
  Layers,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { NightflowLogoMark } from '../../common/NightflowLogo';

interface MockTable {
  id: string;
  name: string;
  pax: number;
  minSpend: number;
  status: 'AVAILABLE' | 'HELD' | 'OCCUPIED';
  holdTimeRemaining?: number; // en segundos
}

const INITIAL_TABLES: MockTable[] = [
  { id: 'T1', name: 'DJ Booth VIP', pax: 10, minSpend: 250, status: 'OCCUPIED' },
  { id: 'T2', name: 'Suite Privé 01', pax: 15, minSpend: 380, status: 'AVAILABLE' },
  { id: 'T3', name: 'Palco Imperial', pax: 12, minSpend: 300, status: 'AVAILABLE' },
  { id: 'T4', name: 'Terraza Skyline', pax: 8, minSpend: 180, status: 'HELD', holdTimeRemaining: 540 },
  { id: 'T5', name: 'Lounge Oro 02', pax: 6, minSpend: 140, status: 'AVAILABLE' },
  { id: 'T6', name: 'Pista Front Stage', pax: 8, minSpend: 200, status: 'AVAILABLE' },
];

export function SaasVipPassMockup() {
  const [activeTab, setActiveTab] = useState<'pass' | 'tables'>('pass');

  // Estados del Pase VIP
  const [qrCountdown, setQrCountdown] = useState<number>(28);
  const [tokenVersion, setTokenVersion] = useState<number>(1);
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'fraud'>('idle');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [laserActive, setLaserActive] = useState<boolean>(false);

  // Efecto de inclinación 3D para el Pase VIP
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  // Estados del Mini Simulador de Mesas (Holds de 12 min)
  const [tables, setTables] = useState<MockTable[]>(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string>('T2');

  // Temporizador de rotación de token (30s)
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setTokenVersion((v) => v + 1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Temporizador de holds en las mesas
  useEffect(() => {
    const holdTimer = setInterval(() => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.status === 'HELD' && t.holdTimeRemaining !== undefined) {
            const nextTime = t.holdTimeRemaining - 1;
            if (nextTime <= 0) {
              return { ...t, status: 'AVAILABLE', holdTimeRemaining: undefined };
            }
            return { ...t, holdTimeRemaining: nextTime };
          }
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(holdTimer);
  }, []);

  // Manejo de tilt con mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateX: (y - 0.5) * -18,
      rotateY: (x - 0.5) * 18,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  // Simulación de escaneo legítimo (0.04s)
  const handleTestLegit = () => {
    setIsScanning(true);
    setLaserActive(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setLaserActive(false);
      setScanResult('success');
    }, 380);
  };

  // Simulación de detección de screenshot adulterado
  const handleTestFraud = () => {
    setIsScanning(true);
    setLaserActive(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setLaserActive(false);
      setScanResult('fraud');
    }, 380);
  };

  // Forzar rotación inmediata
  const handleForceRotate = () => {
    setTokenVersion((v) => v + 1);
    setQrCountdown(30);
    setScanResult('idle');
  };

  // Reservar / activar hold en una mesa
  const handleToggleHold = (tableId: string) => {
    setSelectedTableId(tableId);
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          if (t.status === 'AVAILABLE') {
            return { ...t, status: 'HELD', holdTimeRemaining: 720 }; // 12 minutos = 720 segundos
          }
          if (t.status === 'HELD') {
            return { ...t, status: 'AVAILABLE', holdTimeRemaining: undefined };
          }
        }
        return t;
      })
    );
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[1];

  const formatHoldTime = (sec?: number) => {
    if (!sec) return '12:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="saas-hero-specimen">
      <div className="saas-interactive-console">
        {/* Selector de pestañas interactivas sin cajas rígidas */}
        <div className="saas-console-tabs" role="tablist">
          <button
            type="button"
            className={`saas-console-tab ${activeTab === 'pass' ? 'active' : ''}`}
            onClick={() => setActiveTab('pass')}
          >
            <CreditCard size={14} />
            <span>Pase VIP Anti-Captura</span>
          </button>
          <button
            type="button"
            className={`saas-console-tab ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            <Layers size={14} />
            <span>Mapa de Mesas en Vivo</span>
          </button>
        </div>

        {/* ── MODO 1: PASE VIP MODERNO CON RELIEVE Y TITULAR CENTRADO ── */}
        {activeTab === 'pass' && (
          <div
            ref={cardRef}
            className="saas-vip-pass-card saas-vip-card--3d"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            }}
          >
            {/* Brillo especular dinámico que sigue el cursor */}
            <div
              className="saas-card-glare"
              style={{
                background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(229, 181, 79, 0.16) 0%, transparent 70%)`,
              }}
            />

            {/* Cabecera de la tarjeta: Enclave & Monograma */}
            <div className="saas-vip-card__top">
              <div className="saas-vip-card__emblem">
                <NightflowLogoMark size={28} theme="gold" className="saas-vip-card__logo" />
                <div>
                  <strong className="saas-vip-card__brand">NIGHTFLOW VIP</strong>
                  <span className="saas-vip-card__sub">ENCLAVE SHA-256 · Nº 8842-v{tokenVersion}</span>
                </div>
              </div>
              <div className="saas-vip-card__status-dot">
                <span className="saas-pulse-indicator" aria-hidden="true" />
                <span>TOKEN ACTIVO</span>
              </div>
            </div>

            {/* Núcleo del titular centrado con jerarquía de autor */}
            <div className="saas-vip-card__holder-hero">
              <span className="saas-vip-card__holder-label">TITULAR EXCLUSIVO //</span>
              <h3 className="saas-vip-card__holder-name">SEBASTIÁN MORALES</h3>
              <div className="saas-vip-card__holder-meta">
                <span>Suite Privé 01</span>
                <span className="saas-vip-sep" aria-hidden="true">·</span>
                <span>15 pax</span>
                <span className="saas-vip-sep" aria-hidden="true">·</span>
                <strong className="saas-vip-card__holder-amount">$380 USD</strong>
              </div>
            </div>

            {/* Bloque central: Código QR Dinámico con escáner láser */}
            <div className="saas-vip-qr-wrapper">
              <div className={`saas-vip-qr-frame ${laserActive ? 'scanning-laser' : ''}`}>
                <svg viewBox="0 0 100 100" className="saas-vip-qr-svg" aria-label="Código QR Dinámico">
                  <rect width="100" height="100" fill="var(--text-high, #ffffff)" rx="10" />
                  <rect x="8" y="8" width="30" height="30" fill="var(--bg-void, #07080c)" rx="4" />
                  <rect x="14" y="14" width="18" height="18" fill="var(--text-high, #ffffff)" />
                  <rect x="18" y="18" width="10" height="10" fill="var(--bg-void, #07080c)" />
                  <rect x="62" y="8" width="30" height="30" fill="var(--bg-void, #07080c)" rx="4" />
                  <rect x="68" y="14" width="18" height="18" fill="var(--text-high, #ffffff)" />
                  <rect x="72" y="18" width="10" height="10" fill="var(--bg-void, #07080c)" />
                  <rect x="8" y="62" width="30" height="30" fill="var(--bg-void, #07080c)" rx="4" />
                  <rect x="14" y="68" width="18" height="18" fill="var(--text-high, #ffffff)" />
                  <rect x="18" y="72" width="10" height="10" fill="var(--bg-void, #07080c)" />
                  <rect x="44" y="14" width="12" height="20" fill="var(--bg-void, #07080c)" rx="2" />
                  <rect x="44" y="66" width="12" height="18" fill="var(--bg-void, #07080c)" rx="2" />
                  {/* Núcleo dorado con micro pulso */}
                  <circle cx="50" cy="50" r="8" fill="var(--saas-gold)" />
                  <circle cx="50" cy="50" r="4" fill="var(--bg-void, #07080c)" />
                </svg>

                {/* Haz de luz láser animado */}
                <div className={`saas-laser-beam ${laserActive ? 'active' : ''}`} />
              </div>

              {/* Contador de rotación del token */}
              <div className="saas-vip-qr-timer">
                <RotateCw size={12} className="saas-spin-icon" />
                <span>
                  ROTACIÓN <strong>00:{qrCountdown.toString().padStart(2, '0')}s</strong> · ANTI-SCREENSHOT
                </span>
                <button
                  type="button"
                  onClick={handleForceRotate}
                  className="saas-refresh-btn"
                  title="Regenerar código ahora"
                  aria-label="Regenerar código"
                >
                  <Sparkles size={11} />
                </button>
              </div>
            </div>

            {/* Acciones de Validación Operativa */}
            <div className="saas-vip-card__actions">
              <button
                type="button"
                onClick={handleTestLegit}
                disabled={isScanning}
                className="saas-btn-action saas-btn-action--primary"
              >
                <Zap size={13} fill="currentColor" />
                <span>{isScanning ? 'Verificando JWS...' : 'Simular Escaneo Válido'}</span>
              </button>
              <button
                type="button"
                onClick={handleTestFraud}
                disabled={isScanning}
                className="saas-btn-action saas-btn-action--ghost"
              >
                <AlertTriangle size={13} />
                <span>Probar Captura Reenviada</span>
              </button>
            </div>

            {/* Feedback HUD en tiempo real */}
            {scanResult === 'success' && (
              <div className="saas-scan-feedback success">
                <div className="saas-feedback-header">
                  <span className="saas-feedback-dot success" />
                  <strong>JWS ED25519 VÁLIDO · ACCESO AUTORIZADO</strong>
                </div>
                <span>Entrada 100% auténtica y pagada. Los 15 invitados pueden ingresar a Suite Privé 01.</span>
              </div>
            )}

            {scanResult === 'fraud' && (
              <div className="saas-scan-feedback fraud">
                <div className="saas-feedback-header">
                  <span className="saas-feedback-dot fraud" />
                  <strong>RECHAZADO · CAPTURA O TOKEN EXPIRADO</strong>
                </div>
                <span>Firma no coincide con el enclave de hardware original. Acceso denegado en puerta.</span>
              </div>
            )}
          </div>
        )}

        {/* ── MODO 2: RADAR DE MESAS Y HOLDS INTERACTIVOS DE 12 MIN ── */}
        {activeTab === 'tables' && (
          <div className="saas-tables-console-card">
            <div className="saas-tables-header">
              <div>
                <strong className="saas-tables-title">Mapa de Mesas en Vivo</strong>
                <span className="saas-tables-sub">Toca una mesa para apartarla durante 12 minutos</span>
              </div>
              <div className="saas-hold-indicator">
                <span className="saas-hold-pulse-dot" aria-hidden="true" />
                <span>HOLD ATÓMICO · 12 MIN</span>
              </div>
            </div>

            {/* Mini mapa de 6 mesas interactivas */}
            <div className="saas-mini-floor-grid">
              {tables.map((table) => {
                const isSelected = table.id === selectedTableId;
                const isHeld = table.status === 'HELD';
                const isOccupied = table.status === 'OCCUPIED';

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleToggleHold(table.id)}
                    disabled={isOccupied}
                    className={`saas-mini-table-btn ${table.status.toLowerCase()} ${
                      isSelected ? 'selected' : ''
                    }`}
                  >
                    <div className="saas-mini-table-id">{table.id}</div>
                    <div className="saas-mini-table-name">{table.name}</div>
                    <div className="saas-mini-table-meta">
                      <span>{table.pax} pax</span>
                      <strong>${table.minSpend}</strong>
                    </div>

                    {isHeld && (
                      <div className="saas-table-hold-tag">
                        <Clock size={10} />
                        <span>{formatHoldTime(table.holdTimeRemaining)}</span>
                      </div>
                    )}

                    {isOccupied && (
                      <span className="saas-table-status-tag occ">
                        <span className="saas-table-dot occ" /> EN SALA
                      </span>
                    )}
                    {table.status === 'AVAILABLE' && (
                      <span className="saas-table-status-tag avail">
                        <span className="saas-table-dot avail" /> LIBRE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Ficha interactiva de la mesa seleccionada */}
            <div className="saas-selected-table-strip">
              <div className="saas-strip-col">
                <span className="saas-strip-label">Mesa Seleccionada</span>
                <strong className="saas-strip-value">{selectedTable.name}</strong>
              </div>
              <div className="saas-strip-col">
                <span className="saas-strip-label">Capacidad & Consumo</span>
                <span className="saas-strip-meta">
                  <Users size={12} /> {selectedTable.pax} personas · ${selectedTable.minSpend} USD
                </span>
              </div>
              <div className="saas-strip-col action">
                <button
                  type="button"
                  onClick={() => handleToggleHold(selectedTable.id)}
                  disabled={selectedTable.status === 'OCCUPIED'}
                  className={`saas-btn-action saas-btn-action--primary ${
                    selectedTable.status === 'HELD' ? 'held-active' : ''
                  }`}
                >
                  {selectedTable.status === 'HELD' ? (
                    <>
                      <RotateCw size={12} />
                      <span>Liberar Mesa</span>
                    </>
                  ) : (
                    <>
                      <Zap size={12} fill="currentColor" />
                      <span>Apartar Mesa (12 min)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Garantía de protección contra sobreventa */}
            <div className="saas-tables-footer-note">
              <ShieldCheck size={13} />
              <span>Transacción aislada: al iniciar checkout, el stock se bloquea durante 12 minutos. Cero mesas duplicadas.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
