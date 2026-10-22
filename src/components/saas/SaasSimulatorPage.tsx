import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

interface DemoTable {
  id: string;
  code: string;
  name: string;
  zone: string;
  capacity: number;
  minSpend: number;
  deposit: number;
  status: 'AVAILABLE' | 'HELD' | 'CONFIRMED';
  heldRemaining?: number;
}

export function SaasSimulatorPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3D Card Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      x: rotateX,
      y: rotateY,
      glareX,
      glareY,
      glareOpacity: 0.85,
    });
  };

  const handleCardMouseLeave = () => {
    setTilt({
      x: 0,
      y: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    });
  };

  // QR dinámico
  const [qrCountdown, setQrCountdown] = useState<number>(28);
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'fraud'>('idle');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Plano de mesas
  const [tables, setTables] = useState<DemoTable[]>([
    { id: 't1', code: 'T-01', name: 'Suite VIP 01', zone: 'Zona Privé', capacity: 15, minSpend: 380, deposit: 120, status: 'AVAILABLE' },
    { id: 't2', code: 'T-02', name: 'Palco Escenario', zone: 'Escenario', capacity: 10, minSpend: 280, deposit: 90, status: 'CONFIRMED' },
    { id: 't3', code: 'T-03', name: 'Cabina DJ VIP', zone: 'Frente al DJ', capacity: 12, minSpend: 450, deposit: 150, status: 'HELD', heldRemaining: 680 },
    { id: 't4', code: 'T-04', name: 'Pista Central', zone: 'Pista', capacity: 8, minSpend: 180, deposit: 60, status: 'AVAILABLE' },
    { id: 't5', code: 'T-05', name: 'Terraza Rooftop', zone: 'Exterior', capacity: 6, minSpend: 150, deposit: 50, status: 'AVAILABLE' },
    { id: 't6', code: 'T-06', name: 'Palco Segundo Nivel', zone: 'Balcón', capacity: 10, minSpend: 300, deposit: 100, status: 'AVAILABLE' },
  ]);
  const [selectedTableId, setSelectedTableId] = useState<string>('t1');

  // KPIs en vivo
  const totalPaxInRoom = tables
    .filter((t) => t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + t.capacity, 0);
  const activeHoldsCount = tables.filter((t) => t.status === 'HELD').length;
  const pendingHoldDeposits = tables
    .filter((t) => t.status === 'HELD')
    .reduce((acc, t) => acc + t.deposit, 0);

  // Contador de rotación del QR cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Contador de hold de mesa
  useEffect(() => {
    const timer = setInterval(() => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.status === 'HELD' && t.heldRemaining && t.heldRemaining > 0) {
            return { ...t, heldRemaining: t.heldRemaining - 1 };
          }
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestLegit = () => {
    setIsScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('success');
    }, 400);
  };

  const handleTestFraud = () => {
    setIsScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('fraud');
    }, 400);
  };

  const handleHoldTable = (id: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'HELD', heldRemaining: 720 } : t))
    );
  };

  const handleConfirmTable = (id: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'CONFIRMED', heldRemaining: undefined } : t))
    );
  };

  const handleFreeTable = (id: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'AVAILABLE', heldRemaining: undefined } : t))
    );
  };

  const activeTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="saas-page">
      <SaasNavbar onOpenModal={openModal} />

      <main className="saas-main">
        <div className="saas-wide-shell">
          {/* Header de la página (alineado a la izquierda, amplio) */}
          <div className="saas-page-header">
            <Link to="/software" className="saas-back-link">
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <div className="saas-badge-gold">ENTORNO DE PRUEBA EN VIVO</div>
            <h1 className="saas-page-title">
              Simulador Operativo: Puerta y Plano Cenital
            </h1>
            <p className="saas-page-lead">
              Comprueba de primera mano cómo interactúa el pase dinámico del invitado con el escáner del personal de seguridad, y cómo los holds de 12 minutos impiden la sobreventa de mesas en el club.
            </p>
          </div>

          {/* Cuadrícula amplia del simulador */}
          <div className="saas-stage">
            <div className="saas-stage__header">
              <div className="saas-stage__status">
                <span className="saas-stage__dot" />
                <span>Simulador de Alta Concurrencia · Sensorial VIP</span>
              </div>
              <div className="saas-stage__header-telemetry">
                <span>Latencia: <strong>0.04s SLA</strong></span>
                <span>Firma: <strong>Ed25519 KMS</strong></span>
                <span>Modo: <strong>Edge Offline Ready</strong></span>
                <span>IVA SRI: <strong>15% Desglosado</strong></span>
              </div>
            </div>

            <div className="saas-stage__split">
              {/* LADO IZQUIERDO: EL PASE VIP EN EL TELÉFONO */}
              <div className="stage-left-panel">
                <div className="stage-panel-headline">
                  <div className="stage-panel-kicker">
                    <Sparkles size={12} />
                    <span>TERMINAL 1 // TELÉFONO DEL CLIENTE</span>
                  </div>
                  <h3 className="stage-panel-title">
                    Pase Dinámico Anti-Screenshot
                  </h3>
                  <p className="stage-panel-desc">
                    Token JWS rotativo firmado asimétricamente cada 30 segundos con clave privada Cloud KMS.
                  </p>
                </div>

                <div className="stage-sim-card-wrap">
                  <div
                    ref={cardRef}
                    className="stage-sim-vip-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                      transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    }}
                  >
                    <div
                      className="stage-card-glare"
                      style={{
                        background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.22) 0%, rgba(229, 181, 79, 0.12) 35%, transparent 70%)`,
                        opacity: tilt.glareOpacity,
                      }}
                    />

                    <div className="stage-sim-card-top">
                      <div className="stage-sim-card-brand">
                        <NightflowLogoMark size={28} theme="gold" />
                        <div>
                          <strong>NIGHTFLOW VIP</strong>
                          <span>BLACK PASS · HIGH TIER</span>
                        </div>
                      </div>
                      <div className="stage-sim-status-pill">
                        <span className="stage-phone-pulse" />
                        <span>ACTIVO</span>
                      </div>
                    </div>

                    <div className="stage-sim-holder-hero">
                      <span className="stage-sim-holder-label">TITULAR EXCLUSIVO</span>
                      <h4 className="stage-sim-holder-name">SEBASTIÁN MORALES</h4>
                      <div className="stage-sim-holder-meta">
                        <span>Suite Privé 01</span>
                        <span>·</span>
                        <span>15 pax</span>
                        <span>·</span>
                        <span className="stage-sim-holder-amount">$380 USD</span>
                      </div>
                    </div>

                    <div className="stage-sim-qr-bay">
                      <div className="stage-sim-qr-frame">
                        <svg viewBox="0 0 100 100" aria-label="Código QR Dinámico Criptográfico">
                          <rect width="100" height="100" fill="var(--text-high, #ffffff)" rx="8" />
                          <rect x="8" y="8" width="30" height="30" fill="var(--bg-void, #07080c)" rx="3" />
                          <rect x="14" y="14" width="18" height="18" fill="var(--text-high, #ffffff)" />
                          <rect x="18" y="18" width="10" height="10" fill="var(--bg-void, #07080c)" />
                          <rect x="62" y="8" width="30" height="30" fill="var(--bg-void, #07080c)" rx="3" />
                          <rect x="68" y="14" width="18" height="18" fill="var(--text-high, #ffffff)" />
                          <rect x="72" y="18" width="10" height="10" fill="var(--bg-void, #07080c)" />
                          <rect x="8" y="62" width="30" height="30" fill="var(--bg-void, #07080c)" rx="3" />
                          <rect x="14" y="68" width="18" height="18" fill="var(--text-high, #ffffff)" />
                          <rect x="18" y="72" width="10" height="10" fill="var(--bg-void, #07080c)" />
                          <rect x="44" y="14" width="12" height="20" fill="var(--bg-void, #07080c)" rx="2" />
                          <rect x="44" y="66" width="12" height="18" fill="var(--bg-void, #07080c)" rx="2" />
                          <circle cx="50" cy="50" r="9" fill="var(--saas-gold, #e5b54f)" />
                          <circle cx="50" cy="50" r="4.5" fill="var(--bg-void, #07080c)" />
                        </svg>
                        <div className={`stage-sim-laser ${isScanning ? 'active' : ''}`} />
                      </div>

                      <div className="stage-sim-timer-line">
                        <span>
                          Cambia en <strong>00:{qrCountdown.toString().padStart(2, '0')}s</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setQrCountdown(30)}
                          className="stage-sim-rotate-btn"
                          title="Forzar rotación criptográfica"
                        >
                          <RotateCw size={11} className={isScanning ? 'spin' : ''} />
                          <span>Rotar token</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stage-sim-actions">
                  <button
                    type="button"
                    onClick={handleTestLegit}
                    disabled={isScanning}
                    className="stage-btn-scan"
                  >
                    <Zap size={15} fill="currentColor" />
                    <span>{isScanning ? 'Verificando con Clave KMS...' : 'Escanear Pase Legítimo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestFraud}
                    disabled={isScanning}
                    className="stage-btn-fraud"
                  >
                    <AlertTriangle size={15} />
                    <span>Probar Captura Reenviada (Fraude)</span>
                  </button>
                </div>

                {!isScanning && scanResult === 'success' && (
                  <div className="stage-sim-feedback success">
                    <div className="stage-sim-feedback-top">
                      <CheckCircle2 size={15} />
                      <span>ACCESO VIP AUTORIZADO (0.04s SLA)</span>
                    </div>
                    <div className="stage-sim-feedback-body">
                      Firma Ed25519 verificada localmente por el enclave. Titular legítimo y aforo actualizado en puerta en tiempo real.
                    </div>
                  </div>
                )}

                {!isScanning && scanResult === 'fraud' && (
                  <div className="stage-sim-feedback fraud">
                    <div className="stage-sim-feedback-top">
                      <XCircle size={15} />
                      <span>ACCESO DENEGADO // TOKEN DUPLICADO O SCREENSHOT</span>
                    </div>
                    <div className="stage-sim-feedback-body">
                      Firma temporal de 30s expirada o pase reenviado vía WhatsApp/captura. La passkey no coincide con el hardware emisor.
                    </div>
                  </div>
                )}
              </div>

              {/* LADO DERECHO: EL PLANO DE SALA & HOLDS */}
              <div className="stage-right-panel">
                <div className="stage-floor-header">
                  <div className="stage-panel-kicker">
                    <Clock size={12} />
                    <span>TERMINAL 2 // CONSOLA DE SALA &amp; BARRA</span>
                  </div>
                  <h3 className="stage-panel-title">
                    Inventario de Mesas en Tiempo Real
                  </h3>
                  <p className="stage-panel-desc">
                    Toca cualquier mesa para auditar anticipo y consumo mínimo. Aplica holds atómicos de 12 minutos para impedir sobreventas simultáneas.
                  </p>
                </div>

                {/* Tira de Micro-KPIs */}
                <div className="stage-metrics-ribbon">
                  <div className="stage-metric-cell">
                    <span className="stage-metric-label">Aforo en Sala</span>
                    <span className="stage-metric-value">{totalPaxInRoom} pax</span>
                    <span className="stage-metric-sub">Mesas confirmadas</span>
                  </div>
                  <div className="stage-metric-cell">
                    <span className="stage-metric-label">Holds Activos</span>
                    <span className="stage-metric-value stage-metric-value--gold">{activeHoldsCount}</span>
                    <span className="stage-metric-sub">Bloqueo de 12 min</span>
                  </div>
                  <div className="stage-metric-cell">
                    <span className="stage-metric-label">Anticipos en Espera</span>
                    <span className="stage-metric-value stage-metric-value--gold">${pendingHoldDeposits} USD</span>
                    <span className="stage-metric-sub">En checkout activo</span>
                  </div>
                </div>

                {/* Grilla de Mesas VIP */}
                <div className="stage-floor-grid">
                  {tables.map((t) => {
                    const isSel = t.id === selectedTableId;
                    return (
                      <div
                        key={t.id}
                        className={`stage-table-tile ${isSel ? 'selected' : ''}`}
                        onClick={() => setSelectedTableId(t.id)}
                      >
                        <div className="stage-tile-top">
                          <span className="stage-tile-code">{t.code}</span>
                          <span
                            className={`stage-tile-status-tag ${
                              t.status === 'AVAILABLE'
                                ? 'stage-tile-status-tag--avail'
                                : t.status === 'HELD'
                                ? 'stage-tile-status-tag--held'
                                : 'stage-tile-status-tag--confirmed'
                            }`}
                          >
                            {t.status === 'AVAILABLE' && 'Libre'}
                            {t.status === 'HELD' &&
                              `Hold ${Math.floor((t.heldRemaining || 0) / 60)}:${
                                (t.heldRemaining || 0) % 60 < 10 ? '0' : ''
                              }${(t.heldRemaining || 0) % 60}m`}
                            {t.status === 'CONFIRMED' && 'Confirmada'}
                          </span>
                        </div>

                        <div>
                          <h4 className="stage-tile-name">{t.name}</h4>
                          <span className="stage-tile-zone">{t.zone}</span>
                        </div>

                        <div className="stage-tile-meta-row">
                          <span className="stage-tile-pax">
                            <Users size={12} />
                            <span>{t.capacity} pax</span>
                          </span>
                          <span className="stage-tile-deposit">
                            Min: ${t.minSpend} · Ant: ${t.deposit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dock de Control de Mesa Activa */}
                <div className="stage-control-dock">
                  <div className="stage-dock-info">
                    <span className="stage-dock-overline">Mesa Seleccionada // {activeTable.code}</span>
                    <strong className="stage-dock-title">{activeTable.name}</strong>
                    <div className="stage-dock-meta">
                      Capacidad: <strong>{activeTable.capacity} pax</strong> · Consumo mín: <strong>${activeTable.minSpend} USD</strong> · Anticipo requerido: <strong>${activeTable.deposit} USD</strong>
                    </div>
                  </div>

                  <div className="stage-dock-actions">
                    {activeTable.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        className="stage-btn-hold"
                        onClick={() => handleHoldTable(activeTable.id)}
                      >
                        <Clock size={14} />
                        <span>Bloquear (Hold 12 min)</span>
                      </button>
                    )}
                    {activeTable.status === 'HELD' && (
                      <button
                        type="button"
                        className="stage-btn-confirm"
                        onClick={() => handleConfirmTable(activeTable.id)}
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirmar Pago Anticipo</span>
                      </button>
                    )}
                    {activeTable.status !== 'AVAILABLE' && (
                      <button
                        type="button"
                        className="stage-btn-free"
                        onClick={() => handleFreeTable(activeTable.id)}
                      >
                        <RotateCw size={13} />
                        <span>Liberar Mesa</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Garantía de Concurrencia */}
                <div className="stage-guarantee-footer">
                  <ShieldCheck size={16} />
                  <span>
                    <strong>Garantía de Cero Sobreventa:</strong> Los holds de 12 minutos son atómicos con Cloud Tasks y transacciones Firestore. Si dos clientes intentan reservar la misma mesa a las 02:00 AM, solo uno adquiere el bloqueo; el segundo recibe notificación inmediata de disponibilidad en tiempo real sin colisión.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque técnico explicativo */}
          <div className="saas-tech-grid">
            <div className="saas-tech-card">
              <Zap size={20} color="var(--saas-gold)" />
              <h4>Validación Criptográfica en 0.04s</h4>
              <p>
                Cada pase es un token JWS firmado con Ed25519. El escáner verifica la firma localmente sin necesidad de consultar bases de datos remotas en cada lectura.
              </p>
            </div>
            <div className="saas-tech-card">
              <ShieldCheck size={20} color="var(--saas-gold)" />
              <h4>Prevención del Doble Ingreso</h4>
              <p>
                El token incluye un identificador único (JTI). Si se detecta un intento simultáneo en dos puertas, el sistema genera de inmediato un incidente de seguridad.
              </p>
            </div>
            <div className="saas-tech-card">
              <Lock size={20} color="var(--saas-gold)" />
              <h4>Reserva Atómica con Google Cloud Tasks</h4>
              <p>
                Cuando un invitado inicia la compra, la mesa se bloquea exactamente durante 12 minutos. Si la pasarela falla o se abandona el checkout, el stock se libera al segundo.
              </p>
            </div>
          </div>

          {/* Banner de llamada a la acción */}
          <div className="saas-page-cta">
            <div>
              <h3>¿Quieres ver cómo funciona en el plano de tu discoteca?</h3>
              <p>Cargamos tu mapa y configuramos los pases dinámicos en menos de 24 horas.</p>
            </div>
            <button
              type="button"
              className="btn-gold"
              onClick={() => openModal()}
              style={{ padding: '12px 28px', fontSize: '0.9rem' }}
            >
              <span>Activar Mi Club</span>
              <ArrowRight size={15} />
            </button>
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
