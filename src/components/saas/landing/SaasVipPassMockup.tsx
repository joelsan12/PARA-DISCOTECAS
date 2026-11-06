import { useState, useEffect } from 'react';
import {
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scan,
} from 'lucide-react';
import { NightflowLogoMark } from '../../common/NightflowLogo';

export function SaasVipPassMockup() {
  const [qrCountdown, setQrCountdown] = useState<number>(28);
  const [tokenVersion, setTokenVersion] = useState<number>(1);
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'fraud'>('idle');
  const [isScanning, setIsScanning] = useState<boolean>(false);

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

  // Simulación de escaneo legítimo en puerta
  const handleTestLegit = () => {
    setIsScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('success');
    }, 280);
  };

  // Simulación de intento de entrada con captura vieja
  const handleTestFraud = () => {
    setIsScanning(true);
    setScanResult('idle');
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('fraud');
    }, 280);
  };

  // Forzar regeneración manual
  const handleForceRotate = () => {
    setTokenVersion((v) => v + 1);
    setQrCountdown(30);
    setScanResult('idle');
  };

  return (
    <div className="saas-hero-specimen">
      <div className="saas-vip-pass-card">
        {/* Cabecera del Pase: Monograma y Estado */}
        <div className="saas-vip-card__top">
          <div className="saas-vip-card__emblem">
            <NightflowLogoMark size={26} theme="gold" className="saas-vip-card__logo" />
            <div>
              <strong className="saas-vip-card__brand">NIGHTFLOW VIP</strong>
              <span className="saas-vip-card__sub">PASE DIGITAL · Nº 8842-v{tokenVersion}</span>
            </div>
          </div>
          <div className="saas-vip-card__status-dot">
            <span className="saas-pulse-indicator" aria-hidden="true" />
            <span>ACTIVO</span>
          </div>
        </div>

        {/* Datos de la Reserva */}
        <div className="saas-vip-card__holder-hero">
          <span className="saas-vip-card__holder-label">RESERVA VIP //</span>
          <h3 className="saas-vip-card__holder-name">SEBASTIÁN MORALES</h3>
          <div className="saas-vip-card__holder-meta">
            <span>Suite Privé 01</span>
            <span className="saas-vip-sep" aria-hidden="true">·</span>
            <span>15 personas</span>
            <span className="saas-vip-sep" aria-hidden="true">·</span>
            <strong className="saas-vip-card__holder-amount">$380 USD</strong>
          </div>
        </div>

        {/* Código QR Dinámico con Aro de Rotación */}
        <div className="saas-vip-qr-wrapper">
          <div className="saas-vip-qr-frame">
            <svg viewBox="0 0 100 100" className="saas-vip-qr-svg" aria-label="Código QR Dinámico">
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
              {/* Núcleo dorado con micro pulso */}
              <circle cx="50" cy="50" r="7" fill="var(--saas-gold)" />
              <circle cx="50" cy="50" r="3.5" fill="var(--bg-void, #07080c)" />
            </svg>
          </div>

          {/* Temporizador de rotación limpia */}
          <div className="saas-vip-qr-timer">
            <RotateCw size={12} className="saas-spin-icon" />
            <span>
              ROTACIÓN <strong>00:{qrCountdown.toString().padStart(2, '0')}s</strong> · ANTICAPIA
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

        {/* Única Interacción Memorable: Simulación de Validación en Puerta */}
        <div className="saas-vip-card__actions">
          <button
            type="button"
            onClick={handleTestLegit}
            disabled={isScanning}
            className="saas-btn-action saas-btn-action--primary"
          >
            <Scan size={14} />
            <span>{isScanning ? 'Leyendo escáner...' : 'Simular lectura en puerta'}</span>
          </button>
          <button
            type="button"
            onClick={handleTestFraud}
            disabled={isScanning}
            className="saas-btn-action saas-btn-action--ghost"
            title="Probar qué sucede si alguien intenta entrar con una captura de pantalla anterior"
          >
            <AlertTriangle size={13} />
            <span>Probar captura vieja</span>
          </button>
        </div>

        {/* Feedback Operativo Inmediato */}
        {scanResult === 'success' && (
          <div className="saas-scan-feedback success" role="status">
            <div className="saas-feedback-header">
              <CheckCircle2 size={14} className="saas-feedback-icon" />
              <strong>ACCESO CONFIRMADO · PUERTA 1</strong>
            </div>
            <p className="saas-feedback-meta">
              Código verificado en puerta. Sebastián Morales + 14 acompañantes autorizados.
            </p>
          </div>
        )}

        {scanResult === 'fraud' && (
          <div className="saas-scan-feedback fraud" role="alert">
            <div className="saas-feedback-header">
              <AlertTriangle size={14} className="saas-feedback-icon" />
              <strong>RECHAZADO: CÓDIGO EXPIRADO</strong>
            </div>
            <p className="saas-feedback-meta">
              Captura reenviada o código antiguo detectado. El acceso fue denegado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
