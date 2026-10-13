import { User, Bell, MessageSquare, ChevronLeft, ChevronDown, LogOut } from 'lucide-react';
import type { Club, ClubEvent, ClientUser } from '../../../types';

const formatEventDate = (date: string) => {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha por confirmar';

  const label = new Intl.DateTimeFormat('es-EC', {
    weekday: 'short',
    day: '2-digit',
  }).format(parsedDate);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

interface Props {
  activeClub: Club;
  clubs: Club[];
  activeEvent?: ClubEvent;
  clientUser: ClientUser | null;
  hideClubSwitcher?: boolean;
  onBack?: () => void;
  onSignOut?: () => void;
  onSelectClub: (clubId: string) => void;
  onOpenIdentity: () => void;
  onOpenConcierge?: () => void;
  showConcierge?: boolean;
}

export const ClientHeader = ({
  activeClub,
  clubs,
  activeEvent,
  clientUser,
  hideClubSwitcher = false,
  onBack,
  onSignOut,
  onSelectClub,
  onOpenIdentity,
  onOpenConcierge,
  showConcierge,
}: Props) => {
  return (
    <header
      style={{
        flexShrink: 0,
        padding: '12px 14px 8px',
        background: 'rgba(8, 10, 16, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(229, 181, 79, 0.14)',
        zIndex: 20,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* ════════ TOP ROW: BRAND & CONTROLS ════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Left: Back Arrow + Venue Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {onBack && (
            <button
              type="button"
              aria-label="Volver"
              onClick={onBack}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                fontFamily: 'var(--font-brand)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeClub.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
              <span
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--brand-gold, #e5b54f)',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Mesas & Sala VIP
              </span>
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Date Pill + VIP Profile Avatar + Beta / SignOut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Date Selector Pill */}
          <button
            type="button"
            title={activeEvent?.title || 'Fecha activa'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 7px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(229, 181, 79, 0.22)',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.64rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--brand-gold, #e5b54f)',
                boxShadow: '0 0 6px #e5b54f',
                flexShrink: 0,
              }}
            />
            <span>{activeEvent ? formatEventDate(activeEvent.date) : 'Hoy'}</span>
            <ChevronDown size={10} color="rgba(255, 255, 255, 0.4)" />
          </button>

          {/* Concierge Button (solo en modo invitado si no tiene dock) */}
          {!clientUser && showConcierge && onOpenConcierge && (
            <button
              id="concierge-header-btn"
              type="button"
              onClick={onOpenConcierge}
              title="Concierge VIP en Sala"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#38bdf8',
                flexShrink: 0,
              }}
            >
              <Bell size={12} />
            </button>
          )}

          {/* VIP Member / Login Button */}
          <button
            id="vip-profile-btn"
            type="button"
            onClick={onOpenIdentity}
            title={clientUser ? `Socio VIP: ${clientUser.name}` : 'Acceso & Membresía VIP'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: clientUser ? '2px 7px 2px 2px' : '5px 8px',
              borderRadius: '9999px',
              background: 'rgba(229, 181, 79, 0.12)',
              border: '1px solid rgba(229, 181, 79, 0.38)',
              cursor: 'pointer',
              color: 'var(--brand-gold, #e5b54f)',
              fontSize: '0.64rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {clientUser ? (
              <>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e5b54f 0%, #ca8100 100%)',
                    color: '#0e0b04',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {clientUser.name.charAt(0).toUpperCase()}
                </span>
                <span
                  style={{
                    maxWidth: '54px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#ffb95f',
                  }}
                >
                  {clientUser.name.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.52rem',
                    background: 'rgba(229, 181, 79, 0.28)',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    fontWeight: 800,
                  }}
                >
                  VIP
                </span>
              </>
            ) : (
              <>
                <User size={12} />
                <span>Acceso</span>
              </>
            )}
          </button>

          {/* Feedback Beta Icon Button */}
          <button
            id="header-beta-feedback-btn"
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-beta-feedback'))}
            title="Feedback de la Beta VIP"
            aria-label="Feedback de la Beta VIP"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(229, 181, 79, 0.08)',
              border: '1px solid rgba(229, 181, 79, 0.26)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--brand-gold, #e5b54f)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={12} />
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.55)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ════════ CLUB SWITCHER (IF MULTI-CLUB) ════════ */}
      {!hideClubSwitcher && clubs.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {clubs.map((club) => {
            const isActive = club.id === activeClub.id;
            return (
              <button
                key={club.id}
                onClick={() => onSelectClub(club.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.62rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'linear-gradient(135deg, #e5b54f, #ca8100)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#0e0b04' : 'rgba(255, 255, 255, 0.5)',
                  border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.03em',
                }}
              >
                {club.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* ════════ MAP STATUS LEGEND STRIP ════════ */}
      <div
        style={{
          marginTop: '9px',
          padding: '6px 10px',
          borderRadius: '12px',
          background: 'rgba(13, 16, 25, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Disponible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'rgba(229, 181, 79, 0.08)',
              border: '1.5px solid rgba(229, 181, 79, 0.55)',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.64rem',
              color: 'rgba(255, 255, 255, 0.65)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Disponible
          </span>
        </div>

        {/* Seleccionada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ffb95f',
              boxShadow: '0 0 8px rgba(255, 185, 95, 0.85)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.64rem',
              color: '#ffb95f',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            Seleccionada
          </span>
        </div>

        {/* En Hold */}
        <div
          title="Hold temporal garantizado por 12 minutos"
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.8)',
              boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.64rem',
              color: '#fbbf24',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            En Hold
          </span>
        </div>

        {/* Ocupada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.64rem',
              color: 'rgba(255, 255, 255, 0.38)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Ocupada
          </span>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
