import { Link } from 'react-router-dom';
import { useClubStore } from '../../store/clubStore';
import { VipProfileCard } from './identity/VipProfileCard';
import { signOutBusinessCustomer } from '../../lib/businessAuth';
import { ArrowLeft, Crown, ShieldCheck } from 'lucide-react';

interface Props {
  onGoToMap: () => void;
  onSignOut?: () => void;
}

export const ClientIdentityHub = ({ onGoToMap, onSignOut }: Props) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clientUser = store.clientUser;
  const latestReservation = clientUser
    ? store.reservations.find(r => r.club_id === activeClub.id && (
        r.customer_name === clientUser.name ||
        (clientUser.email && r.customer_email === clientUser.email) ||
        (clientUser.phone && r.customer_phone === clientUser.phone) ||
        r.id.includes(clientUser.id)
      ))
    : undefined;

  if (!clientUser) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(ellipse at top, #181528 0%, #090a0f 80%)',
        color: '#e4e1ed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(18, 19, 26, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.55)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'rgba(229, 181, 79, 0.12)',
            border: '2px solid rgba(229, 181, 79, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="#e5b54f" />
          </div>

          <span style={{
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#ffb95f',
            fontWeight: 800,
            display: 'block',
            marginBottom: '8px',
          }}>
            Acceso verificado
          </span>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Inicia sesión en {activeClub.name}
          </h1>

          <p style={{ fontSize: '0.88rem', color: '#a59eaf', margin: '0 0 24px', lineHeight: 1.55 }}>
            La identidad se valida con Firebase Authentication (código OTP o correo).
            No simulamos accesos desde este portal.
          </p>

          <Link
            to={`/negocio/${activeClub.slug}/acceso`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '13px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e5b54f, #ca8100)',
              color: '#120c02',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            <Crown size={16} />
            Ir a acceso VIP
          </Link>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#a59eaf',
              fontSize: '0.8rem',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Volver al directorio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at top, #181528 0%, #090a0f 80%)',
      color: '#e4e1ed',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
      overflowX: 'hidden',
    }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '62px',
      }}>
        <button
          type="button"
          onClick={onGoToMap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffb95f',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Plano</span>
        </button>

        <span style={{
          fontFamily: 'var(--font-brand)',
          fontSize: '0.95rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: '#fff',
        }}>
          {activeClub.name.toUpperCase()}
        </span>

        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e5b54f, #ca8100)',
          color: '#0f0b04',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.85rem',
          boxShadow: '0 0 12px rgba(229, 181, 79, 0.4)',
        }}>
          {clientUser.name.charAt(0).toUpperCase()}
        </div>
      </header>

      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '30px 16px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 12px',
            borderRadius: '50%',
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid rgba(229, 181, 79, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px rgba(229, 181, 79, 0.3)',
          }}>
            <Crown size={32} color="#e5b54f" />
          </div>

          <span style={{
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#ffb95f',
            fontWeight: 800,
            display: 'block',
            marginBottom: '4px',
          }}>
            Membresía &amp; Acceso VIP
          </span>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            Bienvenido, {clientUser.name}
          </h2>

          <p style={{ fontSize: '0.84rem', color: '#a59eaf', margin: '0 auto', maxWidth: '320px' }}>
            Tu credencial VIP está activa. Puedes reservar mesas y acceder a eventos exclusivos.
          </p>
        </div>

        <VipProfileCard
          clientUser={clientUser}
          latestReservation={latestReservation}
          onGoToMap={onGoToMap}
          onLogout={() => {
            if (onSignOut) {
              onSignOut();
            } else {
              void signOutBusinessCustomer().finally(() => {
                store.clearBusinessPortalSession();
                store.logoutClient();
              });
            }
          }}
        />
      </main>
    </div>
  );
};

export default ClientIdentityHub;
