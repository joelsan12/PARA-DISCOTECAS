import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { DoorQrCameraScanner, isQrCameraSupported, type QrScannerStatus } from '../../lib/doorQrScanner';

interface Props {
  enabled: boolean;
  onDetect: (text: string) => void;
}

export const QrCameraScanner = ({ enabled, onDetect }: Props) => {
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
    if (!enabled || !supported || !videoRef.current) return;
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
  }, [enabled, onDetect, stop, supported]);

  useEffect(() => {
    if (enabled && supported) void start();
    else void stop();
    return () => {
      void stop();
    };
  }, [enabled, supported, start, stop]);

  if (!enabled) return null;

  if (!supported) {
    return (
      <div style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#93c5fd',
        fontSize: '0.76rem',
        marginBottom: '12px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <CameraOff size={15} />
        <span>Cámara QR no disponible en este navegador. Usa el campo manual con el contenido del pase.</span>
      </div>
    );
  }

  return (
    <div className="door-camera-wrapper">
      <div className="door-camera-viewport">
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
              <ScanLine size={32} color="rgba(229, 181, 79, 0.35)" />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '0 16px'
            }}>
              <Camera size={34} color="rgba(229, 181, 79, 0.7)" />
              <div style={{ fontSize: '0.8rem', color: '#e5b54f', fontWeight: 700, textAlign: 'center' }}>
                {message || 'Iniciando cámara frontal/posterior…'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="door-camera-footer">
        <span className="badge" style={{
          background: status === 'scanning' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(229, 181, 79, 0.12)',
          color: status === 'scanning' ? '#34d399' : '#e5b54f',
          border: `1px solid ${status === 'scanning' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(229, 181, 79, 0.35)'}`,
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          <ScanLine size={12} />
          {status === 'scanning' ? 'ESCÁNER ACTIVO EN VIVO' : status.toUpperCase()}
        </span>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.74rem', minHeight: '34px', borderRadius: '8px' }}
          onClick={() => void start()}
        >
          Reintentar cámara
        </button>
      </div>
    </div>
  );
};

export default QrCameraScanner;
