import { useState, type FormEvent } from 'react';
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { signInAdminWithPassword } from '../../lib/adminAuth';

interface Props {
  onSuccess?: () => void;
  unauthorizedReason?: string;
  onSignOut?: () => void;
}

export const AdminLoginView = ({ onSuccess, unauthorizedReason, onSignOut }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña corporativa.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await signInAdminWithPassword(email, password);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMessage('Credenciales no válidas. Verifica correo y contraseña.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Demasiados intentos fallidos. Inténtalo más tarde.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Error al autenticar con el servidor de Nightflow.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickFill = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Nightflow2026!');
  };

  if (unauthorizedReason) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090A0F',
        padding: '24px'
      }}>
        <div className="glass-card" style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px',
          textAlign: 'center',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          background: 'linear-gradient(180deg, rgba(24, 12, 18, 0.95) 0%, rgba(12, 6, 9, 0.98) 100%)',
          boxShadow: '0 0 40px rgba(244, 63, 94, 0.15)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f43f5e'
          }}>
            <AlertTriangle size={28} />
          </div>

          <h2 className="font-brand" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Acceso Corporativo Restringido
          </h2>

          <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '24px' }}>
            {unauthorizedReason}
          </p>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            AGENTS §10: El rol del personal se valida exclusivamente en el servidor (<code style={{ color: '#00f0ff' }}>businesses/staff</code>).
          </p>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '8px',
                fontWeight: 700
              }}
            >
              Cerrar sesión e intentar con otra cuenta
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#090A0F',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, rgba(229, 181, 79, 0.04) 50%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />

      <div className="glass-card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(0, 240, 255, 0.2)',
        background: 'linear-gradient(180deg, rgba(16, 20, 30, 0.95) 0%, rgba(9, 11, 17, 0.98) 100%)',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={14} color="#00f0ff" />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00f0ff', letterSpacing: '0.08em' }}>
              AUTENTICACIÓN REQUERIDA · AGENTS §10
            </span>
          </div>

          <h1 className="font-brand" style={{
            fontSize: '1.7rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.03em',
            margin: '0 0 6px'
          }}>
            NIGHTFLOW VIP
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
            Consola Operativa de Personal y Administración
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.8rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              CORREO CORPORATIVO
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@discoteca.com"
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              CONTRASEÑA
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '12px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
              border: 'none',
              color: '#090a0f',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Acceder a la Consola</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Development Quick-fill */}
        {import.meta.env.DEV && (
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Modo Desarrollo Local
            </span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => handleDevQuickFill('admin@nightflow.vip')}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Auto-fill Admin
              </button>
              <button
                type="button"
                onClick={() => handleDevQuickFill('puerta@barahunda.com')}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Auto-fill Puerta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
