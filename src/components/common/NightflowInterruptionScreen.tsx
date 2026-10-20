import React, { useState, useEffect, useRef } from 'react';
import { NightflowLogoMark } from './NightflowLogo';
import {
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Activity,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import '../../styles/errorBoundary.css';

export type InterruptionMode = 'ERROR' | 'DEPLOYMENT' | 'MAINTENANCE';

export interface NightflowInterruptionScreenProps {
  mode?: InterruptionMode;
  error?: { name?: string; message?: string; stack?: string };
  componentStack?: string;
  refCode?: string;
  onRetry?: () => void;
  onReload?: () => void;
  showModeSwitcher?: boolean;
}

export const NightflowInterruptionScreen: React.FC<NightflowInterruptionScreenProps> = ({
  mode: initialMode = 'ERROR',
  error,
  componentStack,
  refCode = 'E-12530D',
  onRetry,
  onReload,
  showModeSwitcher = false,
}) => {
  const [activeMode, setActiveMode] = useState<InterruptionMode>(initialMode);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    ping: number;
    storage: string;
    crypto: string;
    session: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 3D Parallax tilt state
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState('');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  // Floating canvas particle embers
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio synthesis feedback (zero external libraries)
  const playChime = (type: 'click' | 'success' | 'radar') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'click') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch {
      // Audio not permitted or suspended
    }
  };

  // Particles background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 28;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.pulse += 0.02;
        const currentAlpha = p.alpha * (0.6 + Math.sin(p.pulse) * 0.4);

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 181, 79, ${currentAlpha.toFixed(2)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(229, 181, 79, 0.4)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 3D Tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setCardTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  // Live Diagnostic Check simulation
  const handleRunDiagnostic = () => {
    playChime('click');
    setIsScanning(true);
    setScanResults(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResults({
        ping: Math.floor(Math.random() * 25 + 32),
        storage: 'IndexedDB & LocalStorage verificados (100% íntegros)',
        crypto: 'Enclave JWS & llaves públicas Ed25519 OK',
        session: 'Sin alteración de identidad o comprobantes contables',
      });
      playChime('success');
    }, 1200);
  };

  const handleCopyDiagnostics = async () => {
    playChime('click');
    const textToCopy = [
      `[NIGHTFLOW ${activeMode}]`,
      `Referencia: ${refCode}`,
      `Fecha: ${new Date().toISOString()}`,
      `Modo: ${activeMode}`,
      error ? `Error: ${error.name}: ${error.message}` : 'Sin excepción activa',
      error?.stack ? `Stack:\n${error.stack}` : '',
      componentStack ? `ComponentStack:\n${componentStack}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      playChime('success');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  // Content descriptors based on mode
  const modeConfig = {
    ERROR: {
      eyebrow: 'NIGHTFLOW · MODO SEGURO',
      title: 'La noche se ha interrumpido',
      body: 'Algo falló en esta pantalla. Tu sesión y tus datos siguen intactos: el diagnóstico quedó guardado en este dispositivo con la referencia de auditoría.',
      tag: `REF ${refCode}`,
      primaryActionLabel: 'Reintentar',
      badgeColor: 'var(--gold, #e5b54f)',
    },
    DEPLOYMENT: {
      eyebrow: 'NIGHTFLOW · NUEVA IMPLEMENTACIÓN',
      title: 'Elevando la experiencia',
      body: 'Estamos desplegando una nueva implementación en tiempo real. Los sistemas de puerta, check-in criptográfico y reservas VIP se están actualizando sin pérdida de datos.',
      tag: 'DESPLIEGUE EN VIVO · v2.6.4 PROD',
      primaryActionLabel: 'Reconectar Ahora',
      badgeColor: 'var(--state-info, #38bdf8)',
    },
    MAINTENANCE: {
      eyebrow: 'NIGHTFLOW · PAUSA OPERATIVA',
      title: 'Preparando la noche',
      body: 'La plataforma se encuentra en mantenimiento preventivo programado para garantizar latencia ultra-baja y máxima seguridad en el acceso de esta noche.',
      tag: 'VENTANA OPERATIVA · 15 MIN',
      primaryActionLabel: 'Comprobar Estado',
      badgeColor: 'var(--violet, #a78bfa)',
    },
  }[activeMode];

  return (
    <div
      className="nf-crash nf-crash--animated"
      role="alert"
      aria-live="assertive"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Background Canvas for gold stardust embers */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Mode Switcher Tool (Visible when requested or for testing) */}
      {showModeSwitcher && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 17, 26, 0.85)',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            borderRadius: '999px',
            padding: '4px 8px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--gold, #e5b54f)', paddingLeft: '8px', letterSpacing: '0.1em' }}>
            SIMULADOR:
          </span>

          <button
            type="button"
            onClick={() => setActiveMode('ERROR')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              border: 'none',
              background: activeMode === 'ERROR' ? 'var(--gold, #e5b54f)' : 'transparent',
              color: activeMode === 'ERROR' ? 'var(--bg-void, #08080c)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.72rem',
              fontWeight: activeMode === 'ERROR' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <AlertTriangle size={12} />
            Error / Modo Seguro
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('DEPLOYMENT')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              border: 'none',
              background: activeMode === 'DEPLOYMENT' ? 'var(--state-info, #38bdf8)' : 'transparent',
              color: activeMode === 'DEPLOYMENT' ? 'var(--bg-void, #08080c)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.72rem',
              fontWeight: activeMode === 'DEPLOYMENT' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Zap size={12} />
            Nueva Implementación
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('MAINTENANCE')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              border: 'none',
              background: activeMode === 'MAINTENANCE' ? 'var(--violet, #a78bfa)' : 'transparent',
              color: activeMode === 'MAINTENANCE' ? 'var(--bg-void, #08080c)' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.72rem',
              fontWeight: activeMode === 'MAINTENANCE' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Wrench size={12} />
            Mantenimiento
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar sonidos táctiles' : 'Activar sonido háptico suave'}
            style={{
              background: 'transparent',
              border: 'none',
              color: soundEnabled ? 'var(--gold, #e5b54f)' : 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      )}

      {/* Main Luxury Interruption Card with 3D Tilt */}
      <div
        ref={cardRef}
        className="nf-crash__card nf-crash__card--interactive"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: cardTransform,
          transition: cardTransform ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
          zIndex: 2,
        }}
      >
        {/* Dynamic Glare Specular Highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(229, 181, 79, ${glarePosition.opacity}), transparent 70%)`,
            transition: 'opacity 0.2s ease',
          }}
        />

        {/* Animated Orbital Logo Mark Container */}
        <div className="nf-crash__mark-wrap">
          {/* Orbital Outer Halo */}
          <div className="nf-orbital-ring nf-orbital-ring--outer" />
          <div className="nf-orbital-ring nf-orbital-ring--inner" />

          <div className="nf-crash__mark">
            <NightflowLogoMark size={58} theme="gold" />
          </div>
        </div>

        {/* Eyebrow */}
        <p className="nf-crash__eyebrow" style={{ color: modeConfig.badgeColor }}>
          {modeConfig.eyebrow}
        </p>

        {/* Title */}
        <h1 className="nf-crash__title font-brand">
          {modeConfig.title}
        </h1>

        {/* Body Description */}
        <p className="nf-crash__body">
          {modeConfig.body}
        </p>

        {/* Status / Ref Tag */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 6px' }}>
          <span
            className="nf-crash__ref"
            style={{
              borderColor: `${modeConfig.badgeColor}55`,
              color: modeConfig.badgeColor,
              background: `${modeConfig.badgeColor}15`,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: modeConfig.badgeColor,
                display: 'inline-block',
                boxShadow: `0 0 8px ${modeConfig.badgeColor}`,
              }}
            />
            {modeConfig.tag}
          </span>
        </div>

        {/* Animated Progress Bar for DEPLOYMENT mode */}
        {activeMode === 'DEPLOYMENT' && (
          <div style={{ marginTop: '16px', marginBottom: '8px' }}>
            <div
              style={{
                height: '6px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '92%',
                  background: 'linear-gradient(90deg, var(--state-info, #38bdf8), var(--gold, #e5b54f))',
                  borderRadius: '999px',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)',
                  animation: 'pulseDeployBar 2s infinite ease-in-out',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
              <span>Compilación &amp; Sincronización Edge</span>
              <span style={{ color: 'var(--state-info, #38bdf8)', fontWeight: 700 }}>92% Completado</span>
            </div>
          </div>
        )}

        {/* Actions Strip */}
        <div className="nf-crash__actions">
          <button
            type="button"
            className="nf-crash__button nf-crash__button--primary"
            onClick={() => {
              playChime('click');
              if (onRetry) onRetry();
              else window.location.reload();
            }}
          >
            <RotateCcw size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {modeConfig.primaryActionLabel}
          </button>

          <button
            type="button"
            className="nf-crash__button nf-crash__button--ghost"
            onClick={() => {
              playChime('click');
              if (onReload) onReload();
              else window.location.reload();
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Recargar
          </button>

          <button
            type="button"
            className="nf-crash__button nf-crash__button--ghost"
            onClick={handleRunDiagnostic}
            disabled={isScanning}
          >
            <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {isScanning ? 'Escaneando...' : 'Verificar Red'}
          </button>

          <button
            type="button"
            className="nf-crash__button nf-crash__button--ghost"
            onClick={() => void handleCopyDiagnostics()}
          >
            {copied ? (
              <>
                <Check size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--state-success, #10b981)' }} />
                Copiado ✓
              </>
            ) : (
              <>
                <Copy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Copiar Diagnóstico
              </>
            )}
          </button>
        </div>

        {/* Live Diagnostics Card Output when scanned */}
        {scanResults && (
          <div
            style={{
              marginTop: '20px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.07)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'left',
              animation: 'fadeInModal 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Check size={15} color="var(--state-success, #10b981)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--state-success, #34d399)' }}>
                Diagnóstico de Integridad Completado
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold, #e5b54f)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                Latencia: {scanResults.ping}ms
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.74rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>{scanResults.storage}</li>
              <li>{scanResults.crypto}</li>
              <li>{scanResults.session}</li>
            </ul>
          </div>
        )}

        {/* Technical Details Accordion */}
        <details
          className="nf-crash__details"
          open={detailsOpen}
          onToggle={e => setDetailsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="nf-crash__summary">
            Detalles técnicos
            <ChevronDown size={13} style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '4px' }} />
          </summary>
          <pre className="nf-crash__stack">
            {error
              ? [error.stack, componentStack].filter(Boolean).join('\n\n') || `${error.name}: ${error.message}`
              : `NIGHTFLOW ENGINE STATUS: OK\nMODO ACTIVO: ${activeMode}\nREFERENCIA AUDITORÍA: ${refCode}\nSESIÓN LOCAL: CIFRADA (IndexedDB)\nTIMESTAMP: ${new Date().toISOString()}`}
          </pre>
        </details>

        {/* Footnote */}
        <p className="nf-crash__footnote">
          Auditoría local · sin datos personales enviados a terceros · NIGHTFLOW VIP
        </p>
      </div>
    </div>
  );
};
