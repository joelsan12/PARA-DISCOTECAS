import { Link } from 'react-router-dom';
import { useClubStore } from '../../store/clubStore';
import { VipProfileCard } from './identity/VipProfileCard';
import { BlackCardVipPass } from './identity/BlackCardVipPass';
import { signOutBusinessCustomer } from '../../lib/businessAuth';
import { ArrowLeft, Crown, ShieldCheck, MapPin, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';
import { NightflowLogoMark } from '../common/NightflowLogo';
import { esVipTier } from '../../lib/esLabels';
import type { ClubEvent } from '../../types';

interface Props {
  onGoToMap: () => void;
  onSignOut?: () => void;
}

export const ClientIdentityHub = ({ onGoToMap, onSignOut }: Props) => {
  const store = useClubStore();
  const activeClub = store.clubs.find(c => c.id === store.activeClubId) || store.clubs[0];
  const clientUser = store.clientUser;

  const latestReservation = clientUser
    ? store.reservations.find(r => (r.club_id === activeClub.id || !r.club_id) && (
        r.customer_name === clientUser.name ||
        (clientUser.email && r.customer_email === clientUser.email) ||
        (clientUser.phone && r.customer_phone === clientUser.phone) ||
        r.id.includes(clientUser.id)
      ))
    : undefined;

  const clubEvents = store.events.filter(e => e.club_id === activeClub.id);
  const activeEvent: ClubEvent = (latestReservation?.event_id
    ? store.events.find(e => e.id === latestReservation.event_id)
    : undefined) || clubEvents.find(e => e.id === store.activeEventId) || clubEvents[0] || {
    id: 'evt_noche_vip_sabado',
    club_id: activeClub.id,
    title: 'Noche VIP Sabatina',
    subtitle: 'DJ en vivo & Rooftop Party',
    date: '2026-10-17',
    day_label: 'Sábado',
    door_time: '22:00',
    cover_price: 25,
    dj_guest: 'DJ Residente',
    genre: 'Melodic Techno & House Party',
    flyer_url: '',
    is_published: true,
    experience_type: 'VIP_NIGHT'
  };

  const handleLogout = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      void signOutBusinessCustomer().finally(() => {
        store.clearBusinessPortalSession();
        store.logoutClient();
      });
    }
  };

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

  const isCheckedIn = latestReservation?.status === 'CHECKED_IN';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at top, #161a29 0%, #080b12 70%, #05060a 100%)',
      color: '#e4e1ed',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* ════════ HEADER ════════ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 11, 18, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(229, 181, 79, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '62px',
      }}>
        <button
          type="button"
          onClick={onGoToMap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffb95f',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          <span>Plano</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NightflowLogoMark size={22} theme="gold" />
          <span style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '0.98rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: '#fff',
            textTransform: 'uppercase',
          }}>
            {activeClub.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(229, 181, 79, 0.15)',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            borderRadius: '9999px',
            padding: '4px 8px 4px 5px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e5b54f, #ca8100)',
              color: '#0f0b04',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}>
              {clientUser.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#e5b54f' }}>
              {esVipTier(clientUser.tier)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.65)',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ════════ MAIN CONTENT ════════ */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '20px 16px 90px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* Reservation Status Alert Banner */}
        {latestReservation && (
          <div style={{
            background: isCheckedIn
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(10, 15, 12, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(229, 181, 79, 0.18) 0%, rgba(18, 15, 10, 0.95) 100%)',
            border: isCheckedIn ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(229, 181, 79, 0.45)',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isCheckedIn ? '0 8px 25px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(229, 181, 79, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isCheckedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(229, 181, 79, 0.2)',
                border: isCheckedIn ? '1.5px solid #10b981' : '1.5px solid #e5b54f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isCheckedIn ? <CheckCircle2 size={18} color="#10b981" /> : <Crown size={18} color="#e5b54f" />}
              </div>
              <div>
                <span style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: isCheckedIn ? '#34d399' : '#ffb95f',
                  display: 'block',
                }}>
                  {isCheckedIn ? 'Ingreso Confirmado en Puerta' : 'Reserva VIP Confirmada'}
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff' }}>
                  Mesa {latestReservation.table_code} • {latestReservation.guest_count} Personas
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              color: isCheckedIn ? '#10b981' : '#e5b54f',
              background: isCheckedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(229, 181, 79, 0.2)',
              padding: '4px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.05em',
            }}>
              {isCheckedIn ? 'DENTRO' : 'ACTIVO'}
            </span>
          </div>
        )}

        {/* ════════ HERO BLACK CARD PASS ════════ */}
        {latestReservation ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              padding: '0 4px',
            }}>
              <span style={{
                fontSize: '0.68rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#ffb95f',
                fontWeight: 800,
              }}>
                Pase de Acceso Criptográfico
              </span>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                EdDSA • Rotación 30s
              </span>
            </div>

            {/* Black Card Pass Component */}
            <BlackCardVipPass
              reservation={latestReservation}
              club={activeClub}
              event={activeEvent}
            />

            {/* Quick Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onGoToMap}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(229, 181, 79, 0.12)',
                  border: '1px solid rgba(229, 181, 79, 0.35)',
                  color: '#ffb95f',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <MapPin size={16} />
                <span>Ver Mesa en Plano</span>
              </button>

              <button
                type="button"
                onClick={() => store.setClientSubTab('CONCIERGE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={16} />
                <span>Llamar Concierge</span>
              </button>
            </div>
          </div>
        ) : (
          /* Estado sin reserva */
          <div style={{
            background: 'linear-gradient(145deg, #131926 0%, #080b12 100%)',
            border: '1px solid rgba(229, 181, 79, 0.35)',
            borderRadius: '20px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: 'rgba(229, 181, 79, 0.15)',
              border: '2px solid rgba(229, 181, 79, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(229, 181, 79, 0.25)',
            }}>
              <Crown size={28} color="#e5b54f" />
            </div>

            <span style={{
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#ffb95f',
              fontWeight: 800,
              display: 'block',
              marginBottom: '6px',
            }}>
              Socio VIP {esVipTier(clientUser.tier)}
            </span>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              Hola, {clientUser.name}
            </h2>

            <p style={{ fontSize: '0.82rem', color: '#a59eaf', margin: '0 auto 18px', maxWidth: '300px', lineHeight: 1.5 }}>
              No tienes reservas activas registradas para hoy. Selecciona una mesa VIP en el plano interactivo.
            </p>

            <button
              type="button"
              onClick={onGoToMap}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e5b54f, #ca8100)',
                color: '#120c02',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(229, 181, 79, 0.3)',
              }}
            >
              <Crown size={16} />
              <span>Ver Plano y Reservar Mesa</span>
            </button>
          </div>
        )}

        {/* ════════ VIP PROFILE CARD ════════ */}
        <VipProfileCard
          clientUser={clientUser}
          latestReservation={latestReservation}
          onGoToMap={onGoToMap}
          onLogout={handleLogout}
        />
      </main>
    </div>
  );
};

export default ClientIdentityHub;
