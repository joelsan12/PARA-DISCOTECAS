import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { SaasNavbar } from './SaasNavbar';
import { SaasFooterBar } from './SaasFooterBar';
import { SaasLeadModal } from './SaasLeadModal';
import '../../styles/saas-landing/index.css';

interface DemoTable {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  deposit: number;
  status: 'AVAILABLE' | 'HELD' | 'CONFIRMED';
  heldRemaining?: number;
}

export function SaasSimulatorPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // QR dinámico
  const [qrCountdown, setQrCountdown] = useState<number>(28);
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'fraud'>('idle');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Plano de mesas
  const [tables, setTables] = useState<DemoTable[]>([
    { id: 't1', name: 'Suite VIP 01', zone: 'Zona Privé', capacity: 15, deposit: 120, status: 'AVAILABLE' },
    { id: 't2', name: 'Palco Escenario', zone: 'Escenario', capacity: 10, deposit: 90, status: 'CONFIRMED' },
    { id: 't3', name: 'Cabina DJ VIP', zone: 'Frente al DJ', capacity: 12, deposit: 150, status: 'HELD', heldRemaining: 680 },
    { id: 't4', name: 'Pista Central', zone: 'Pista', capacity: 8, deposit: 60, status: 'AVAILABLE' },
    { id: 't5', name: 'Terraza Rooftop', zone: 'Exterior', capacity: 6, deposit: 50, status: 'AVAILABLE' },
    { id: 't6', name: 'Palco Segundo Nivel', zone: 'Balcón', capacity: 10, deposit: 100, status: 'AVAILABLE' },
  ]);
  const [selectedTableId, setSelectedTableId] = useState<string>('t1');

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
    }, 350);
  };

  const handleTestFraud = () => {
    setIsScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('fraud');
    }, 350);
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
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: 'var(--saas-text-secondary)' }}>
                <span>Latencia: <strong>0.04s</strong></span>
                <span>Firma: <strong>Ed25519</strong></span>
                <span>Modo: <strong>Edge Offline Ready</strong></span>
              </div>
            </div>

            <div className="saas-stage__split">
              {/* LADO IZQUIERDO: EL PASE VIP EN EL TELÉFONO */}
              <div className="stage-left-panel">
                <div style={{ width: '100%', textAlign: 'left', marginBottom: '16px' }}>
                  <span className="saas-badge-gold">TERMINAL 1 // TELÉFONO DEL CLIENTE</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--saas-text-primary)', margin: '4px 0 0' }}>
                    Pase Dinámico Anti-Screenshot
                  </h3>
                </div>

                <div className="stage-phone-mock">
                  <div className="stage-phone-top">
                    <div className="stage-phone-brand">
                      <span className="stage-phone-chip" />
                      <span className="stage-phone-brand-title">NIGHTFLOW VIP</span>
                    </div>
                    <div className="stage-phone-status-tag">
                      <span className="stage-phone-pulse" />
                      <span>ACTIVO</span>
                    </div>
                  </div>

                  <div className="stage-phone-qr-bay">
                    <div className="stage-phone-qr-frame">
                      <svg viewBox="0 0 100 100" aria-label="Código QR Dinámico">
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
                        <circle cx="50" cy="50" r="8" fill="var(--saas-gold)" />
                        <circle cx="50" cy="50" r="4" fill="var(--bg-void, #07080c)" />
                      </svg>
                      <div className={`stage-laser-line ${isScanning ? 'scanning' : ''}`} />
                    </div>

                    <div className="stage-phone-timer">
                      <RotateCw size={11} className={isScanning ? 'spin' : ''} color="var(--saas-gold)" />
                      <span>
                        El código cambia en <strong>00:{qrCountdown.toString().padStart(2, '0')}s</strong> · Evita capturas
                      </span>
                    </div>
                  </div>

                  <div className="stage-phone-strip">
                    <span>Sebastián Morales</span>
                    <span className="stage-phone-sep">·</span>
                    <span>Suite Privé 01</span>
                    <span className="stage-phone-sep">·</span>
                    <strong>15 pax ($380)</strong>
                  </div>
                </div>

                <div className="stage-phone-actions">
                  <button
                    type="button"
                    onClick={handleTestLegit}
                    disabled={isScanning}
                    className="btn-gold"
                    style={{ width: '100%', fontSize: '0.84rem', padding: '12px 16px' }}
                  >
                    <Zap size={14} fill="currentColor" />
                    <span>{isScanning ? 'Verificando con Clave Privada...' : 'Escanear Pase Legítimo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestFraud}
                    disabled={isScanning}
                    className="btn-secondary stage-btn-fraud"
                    style={{ width: '100%', fontSize: '0.84rem', padding: '12px 16px' }}
                  >
                    <AlertTriangle size={14} />
                    <span>Probar Captura Reenviada</span>
                  </button>
                </div>

                {isScanning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.78rem', color: 'var(--saas-gold)' }}>
                    <RotateCw size={14} className="spin" />
                    <span>Verificando firma del enclave de seguridad...</span>
                  </div>
                )}

                {!isScanning && scanResult === 'success' && (
                  <div className="stage-result-banner success">
                    <strong>✓ ACCESO VIP PERMITIDO (0.04s)</strong>
                    <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                      Pase válido y firmado con clave privada. Titular verificado y aforo actualizado.
                    </div>
                  </div>
                )}

                {!isScanning && scanResult === 'fraud' && (
                  <div className="stage-result-banner fraud">
                    <strong>✕ ACCESO DENEGADO (CAPTURA DE PANTALLA)</strong>
                    <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                      Código expirado o reenviado por chat. El pase original ya ingresó o cambió de clave.
                    </div>
                  </div>
                )}
              </div>

              {/* LADO DERECHO: EL PLANO DE SALA & HOLDS */}
              <div className="stage-right-panel">
                <div className="stage-floor-header">
                  <span className="saas-badge-gold">TERMINAL 2 // CONSOLA DE SALA &amp; BARRA</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 6px' }}>
                    Inventario de Mesas en Tiempo Real
                  </h3>
                  <p>
                    Toca cualquier mesa para consultar el anticipo. Haz clic en "Bloquear (Hold 12 min)" para simular el congelamiento de inventario mientras el cliente completa el pago.
                  </p>
                </div>

                <div className="stage-floor-grid">
                  {tables.map((t) => {
                    const isSel = t.id === selectedTableId;
                    return (
                      <div
                        key={t.id}
                        className={`stage-floor-item ${isSel ? 'selected' : ''}`}
                        onClick={() => setSelectedTableId(t.id)}
                      >
                        <div className="stage-floor-item-title">
                          <span>{t.name}</span>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background:
                                t.status === 'AVAILABLE'
                                  ? 'var(--state-success, #34d399)'
                                  : t.status === 'HELD'
                                  ? 'var(--state-hold, #fbbf24)'
                                  : 'var(--text-dim, #8e929d)',
                            }}
                          />
                        </div>
                        <div className="stage-floor-item-meta">
                          {t.zone} · {t.capacity} pax
                        </div>
                        <div className="stage-floor-item-footer">
                          <span className="stage-floor-item-deposit">${t.deposit} USD</span>
                          {t.status === 'HELD' && (
                            <span className="stage-floor-item-timer">
                              HOLD {Math.floor((t.heldRemaining || 0) / 60)}:
                              {(t.heldRemaining || 0) % 60 < 10 ? '0' : ''}
                              {(t.heldRemaining || 0) % 60}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="stage-table-control">
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--saas-text-primary)' }}>
                      Mesa Activa: {activeTable.name}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--saas-text-secondary)' }}>
                      Capacidad: {activeTable.capacity} personas · Anticipo: ${activeTable.deposit} USD · Estado: <strong>{activeTable.status}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {activeTable.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        className="btn-gold"
                        onClick={() => handleHoldTable(activeTable.id)}
                        style={{ fontSize: '0.78rem', padding: '9px 16px' }}
                      >
                        Bloquear (Hold 12 min)
                      </button>
                    )}
                    {activeTable.status === 'HELD' && (
                      <button
                        type="button"
                        className="btn-gold"
                        onClick={() => handleConfirmTable(activeTable.id)}
                        style={{ fontSize: '0.78rem', padding: '9px 16px' }}
                      >
                        Confirmar Pago Anticipo
                      </button>
                    )}
                    {activeTable.status !== 'AVAILABLE' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleFreeTable(activeTable.id)}
                        style={{ fontSize: '0.78rem', padding: '9px 14px' }}
                      >
                        Liberar Mesa
                      </button>
                    )}
                  </div>
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
