import { LogOut, User } from 'lucide-react';
import type { Club, ClubEvent, ClientUser } from '../../../types';

const formatEventDate = (date: string) => {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha por confirmar';

  const label = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
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
}

function LegendDot({ color, borderColor, bgColor, label, textColor, bold, dim }: {
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
  textColor: string;
  bold?: boolean;
  dim?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: bgColor,
        border: `1.5px solid ${borderColor || color}`,
        boxShadow: bold ? `0 0 6px ${color}` : undefined,
        opacity: dim ? 0.4 : 1,
      }} />
      <span style={{
        fontSize: '0.66rem',
        color: textColor,
        fontWeight: bold ? 600 : 400,
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>
    </div>
  );
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
}: Props) => {
  return (
    <header style={{
      flexShrink: 0,
      padding: '14px 16px 0',
      background: 'rgba(9, 10, 15, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      zIndex: 20,
    }}>
      {/* Top row: back + name + date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Back + Club Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            aria-label="Volver"
            onClick={onBack}
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
              color: 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontFamily: 'var(--font-brand)',
            }}>
              {activeClub.name}
            </h1>
            <p style={{
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold)',
              fontWeight: 500,
              margin: 0,
            }}>
              Reserva VIP • Club
            </p>
          </div>
        </div>

        {/* Right Actions: Event Date Pill & VIP Member Access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.66rem',
              fontWeight: 500,
              transition: 'border-color 0.15s ease',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand-gold)',
              animation: 'pulse-gold 2s ease-in-out infinite',
            }} />
            <span>{activeEvent ? formatEventDate(activeEvent.date) : 'Hoy'}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* VIP Member / Login Button */}
          <button
            id="vip-profile-btn"
            onClick={onOpenIdentity}
            title={clientUser ? `Cuenta VIP: ${clientUser.name}` : 'Acceso & Membresía VIP'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: clientUser ? '4px 8px' : '6px 10px',
              borderRadius: '9999px',
              background: clientUser ? 'rgba(229, 181, 79, 0.15)' : 'rgba(229, 181, 79, 0.1)',
              border: clientUser ? '1px solid rgba(229, 181, 79, 0.4)' : '1px solid rgba(229, 181, 79, 0.25)',
              cursor: 'pointer',
              color: '#e5b54f',
              fontSize: '0.66rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            {clientUser ? (
              <>
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#e5b54f',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                }}>
                  {clientUser.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clientUser.name.split(' ')[0]}
                </span>
                <span style={{
                  fontSize: '0.52rem',
                  background: 'rgba(229, 181, 79, 0.25)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontWeight: 800,
                }}>
                  VIP
                </span>
              </>
            ) : (
              <>
                <User size={13} />
                <span>Acceso VIP</span>
              </>
            )}
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.65)',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Club switcher pills */}
      {!hideClubSwitcher && clubs.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '10px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}>
          {clubs.map(club => {
            const isActive = club.id === activeClub.id;
            return (
              <button
                key={club.id}
                onClick={() => onSelectClub(club.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.62rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#000' : 'rgba(255, 255, 255, 0.5)',
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

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '10px',
        paddingTop: '8px',
        paddingBottom: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        <LegendDot color="transparent" borderColor="rgba(255,255,255,0.4)" bgColor="rgba(255,255,255,0.1)" label="Disponible" textColor="rgba(255,255,255,0.6)" />
        <LegendDot color="var(--brand-gold)" borderColor="transparent" bgColor="var(--brand-gold)" label="Seleccionada" textColor="var(--brand-gold)" bold />
        <LegendDot color="transparent" borderColor="rgba(255,255,255,0.05)" bgColor="rgba(255,255,255,0.04)" label="Ocupada" textColor="rgba(255,255,255,0.3)" dim />
      </div>
    </header>
  );
};
