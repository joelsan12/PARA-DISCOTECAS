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
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        position: 'relative',
        height: '200px',
        background: '#04060c',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        overflow: 'hidden'
      }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: status === 'scanning' ? 'block' : 'none'
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          pointerEvents: 'none',
          background: status === 'scanning' ? 'transparent' : 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.06), #04060c)'
        }}>
          {status !== 'scanning' && <Camera size={28} color="rgba(0,240,255,0.5)" />}
          <div style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, textAlign: 'center', padding: '0 12px' }}>
            {message || 'Iniciando cámara…'}
          </div>
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '12%', right: '12%', height: '2px', background: 'rgba(0,240,255,0.7)', boxShadow: '0 0 10px #00f0ff', opacity: status === 'scanning' ? 1 : 0.3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span className="badge" style={{ background: 'rgba(0,240,255,0.08)', color: 'var(--accent)', fontSize: '0.68rem' }}>
          <ScanLine size={11} />
          {status === 'scanning' ? 'ESCÁNER ACTIVO' : status.toUpperCase()}
        </span>
        <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => void start()}>
          Reintentar cámara
        </button>
      </div>
    </div>
  );
};

export default QrCameraScanner;
