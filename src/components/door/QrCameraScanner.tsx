import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine, Siren, ShieldCheck, Pause, RefreshCw } from 'lucide-react';
import { DoorQrCameraScanner, isQrCameraSupported, type QrScannerStatus } from '../../lib/doorQrScanner';

interface Props {
  enabled: boolean;
  onDetect: (text: string) => void;
  onToggleEnabled?: () => void;
  isEmergencyBlocked?: boolean;
  onClearEmergency?: () => void;
}

export const QrCameraScanner = ({
  enabled,
  onDetect,
  onToggleEnabled,
  isEmergencyBlocked = false,
  onClearEmergency
}: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<DoorQrCameraScanner | null>(null);
  const [status, setStatus] = useState<QrScannerStatus>('idle');
  const [message, setMessage] = useState('');
  const supported = isQrCameraSupported();

  const stop = useCallback(async () => {
    await scannerRef.current?.stop();
    scannerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!enabled || !supported || !videoRef.current || isEmergencyBlocked) return;
    await stop();
    const scanner = new DoorQrCameraScanner({
      onDetect,
      onStatus: (next, detail) => {
        setStatus(next);
        if (detail) setMessage(detail);
        else if (next === 'scanning') setMessage('Apunta al pase VIP rotativo');
        else setMessage('');
      }
    });
    scannerRef.current = scanner;
    await scanner.start(videoRef.current);
  }, [enabled, onDetect, stop, supported, isEmergencyBlocked]);

  useEffect(() => {
    if (enabled && supported && !isEmergencyBlocked) {
      void start();
    } else {
      void stop();
    }
    return () => {
      void stop();
    };
  }, [enabled, supported, isEmergencyBlocked, start, stop]);

  if (!supported) {
    return (
      <div style={{
        padding: '14px 16px',
        borderRadius: '14px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#93c5fd',
        fontSize: '0.8rem',
        marginBottom: '14px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <CameraOff size={18} />
        <span>Cámara web o móvil no disponible en este dispositivo. Usa el campo manual inferior para validar pases.</span>
      </div>
    );
  }

  // ─── ESTADO: TERMINAL SUSPENDIDA POR PÁNICO / SOS ────────────────────────
  if (isEmergencyBlocked) {
    return (
      <div className="door-camera-wrapper">
        <div className="door-camera-viewport door-camera-viewport--blocked">
          <div className="door-target-corner door-target-corner--tl" style={{ borderColor: '#f43f5e' }} />
          <div className="door-target-corner door-target-corner--tr" style={{ borderColor: '#f43f5e' }} />
          <div className="door-target-corner door-target-corner--bl" style={{ borderColor: '#f43f5e' }} />
          <div className="door-target-corner door-target-corner--br" style={{ borderColor: '#f43f5e' }} />
          <div className="door-scan-laser" style={{ background: '#f43f5e', boxShadow: '0 0 16px #f43f5e' }} />

          <div className="door-aim-guide">
            <Siren size={44} color="#f43f5e" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fda4af', letterSpacing: '0.04em' }}>
              TERMINAL SUSPENDIDA (SOS ACTIVO)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '0 20px', marginTop: '6px', maxWidth: '320px' }}>
              La terminal de escaneo se bloqueó por protocolo de seguridad de guardia.
            </div>
            {onClearEmergency && (
              <button
                type="button"
                onClick={onClearEmergency}
                className="btn-primary"
                style={{
                  marginTop: '16px',
                  padding: '9px 20px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#34d399',
                  color: '#ffffff',
                  fontWeight: 800,
                  boxShadow: '0 0 18px rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={16} />
                <span>Reactivar terminal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── ESTADO: CÁMARA EN ESPERA (STANDBY INTERACTIVO EN EL MISMO BORDE) ────
  if (!enabled) {
    return (
      <div className="door-camera-wrapper">
        <div
          className="door-camera-viewport door-camera-viewport--standby"
          onClick={onToggleEnabled}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleEnabled?.();
            }
          }}
          title="Toca aquí o en este borde para encender la cámara"
        >
          {/* Esquinas doradas VIP de encuadre */}
          <div className="door-target-corner door-target-corner--tl" />
          <div className="door-target-corner door-target-corner--tr" />
          <div className="door-target-corner door-target-corner--bl" />
          <div className="door-target-corner door-target-corner--br" />

          {/* Línea láser con barrido suave indicativo */}
          <div className="door-scan-laser" style={{ opacity: 0.65 }} />

          {/* Centro interactivo de encendido */}
          <div className="door-aim-guide">
            <div className="door-aim-box" style={{ background: 'rgba(229, 181, 79, 0.05)' }}>
              <ScanLine size={48} color="rgba(229, 181, 79, 0.75)" style={{ filter: 'drop-shadow(0 0 12px rgba(229, 181, 79, 0.4))' }} />
            </div>

            <div style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--brand-gold, #e5b54f)',
              letterSpacing: '0.05em',
              marginTop: '16px',
              textShadow: '0 0 14px rgba(229, 181, 79, 0.3)'
            }}>
              CÁMARA EN ESPERA
            </div>

            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              padding: '0 24px',
              marginTop: '6px',
              maxWidth: '340px'
            }}>
              Toca este recuadro o borde para activar la cámara
            </div>

            {/* Botón táctil primario visual incorporado */}
            <div
              style={{
                marginTop: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.35) 0%, rgba(229, 181, 79, 0.15) 100%)',
                border: '1.5px solid rgba(229, 181, 79, 0.6)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 0 20px rgba(229, 181, 79, 0.25)',
                pointerEvents: 'none'
              }}
            >
              <Camera size={17} color="#fbbf24" />
              <span>ACTIVAR CÁMARA</span>
            </div>
          </div>
        </div>

        <div className="door-camera-footer">
          <span className="badge" style={{
            background: 'rgba(229, 181, 79, 0.12)',
            color: '#e5b54f',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <ScanLine size={12} />
            CÁMARA EN ESPERA
          </span>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.74rem', minHeight: '34px', borderRadius: '8px' }}
            onClick={onToggleEnabled}
          >
            <Camera size={13} style={{ marginRight: '5px' }} />
            Encender
          </button>
        </div>
      </div>
    );
  }

  // ─── ESTADO: CÁMARA ACTIVA Y ESCANEANDO EN EL MISMO BORDE ─────────────────
  return (
    <div className="door-camera-wrapper">
      <div className={`door-camera-viewport ${status === 'scanning' ? 'door-camera-viewport--scanning' : ''}`}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="door-camera-video"
          style={{
            display: status === 'scanning' ? 'block' : 'none'
          }}
        />

        {/* Retículo de enfoque con esquinas de alta precisión */}
        <div className="door-target-corner door-target-corner--tl" />
        <div className="door-target-corner door-target-corner--tr" />
        <div className="door-target-corner door-target-corner--bl" />
        <div className="door-target-corner door-target-corner--br" />

        {/* Línea láser animada continua */}
        {status === 'scanning' && <div className="door-scan-laser" />}

        {/* Guía central de encuadre para portero */}
        <div className="door-aim-guide">
          {status === 'scanning' ? (
            <div className="door-aim-box">
              <ScanLine size={36} color="rgba(229, 181, 79, 0.45)" />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '0 16px'
            }}>
              <Camera size={42} color="rgba(229, 181, 79, 0.85)" />
              <div style={{ fontSize: '0.88rem', color: '#e5b54f', fontWeight: 800, textAlign: 'center' }}>
                {message || 'Iniciando cámara frontal/posterior…'}
              </div>
            </div>
          )}
        </div>

        {/* Floating chip overlay en esquina superior para pausar/estado */}
        {status === 'scanning' && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(5, 5, 8, 0.8)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              color: '#34d399',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              EN VIVO
            </span>
          </div>
        )}
      </div>

      <div className="door-camera-footer">
        <span className="badge" style={{
          background: status === 'scanning' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(229, 181, 79, 0.12)',
          color: status === 'scanning' ? '#34d399' : '#e5b54f',
          border: `1px solid ${status === 'scanning' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(229, 181, 79, 0.35)'}`,
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <ScanLine size={12} />
          {status === 'scanning' ? 'ESCÁNER ACTIVO EN VIVO' : status.toUpperCase()}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.74rem', minHeight: '34px', borderRadius: '8px' }}
            onClick={() => void start()}
            title="Reiniciar lector de cámara"
          >
            <RefreshCw size={13} style={{ marginRight: '4px' }} />
            Reiniciar
          </button>
          {onToggleEnabled && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.74rem', minHeight: '34px', borderRadius: '8px' }}
              onClick={onToggleEnabled}
              title="Pausar cámara"
            >
              <Pause size={13} style={{ marginRight: '4px' }} />
              Pausar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCameraScanner;
