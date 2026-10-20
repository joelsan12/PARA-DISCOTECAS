import type { ClientUser, Reservation } from '../../../types';
import { formatEcuadorPhone } from '../../../lib/formatEcuador';
import { esVipTier } from '../../../lib/esLabels';
import { CheckCircle2, ArrowRight, LogOut, QrCode, Crown, MessageSquare } from 'lucide-react';
import { NightflowLogoMark } from '../../common/NightflowLogo';

interface Props {
  clientUser: ClientUser;
  latestReservation?: Reservation;
  onGoToMap: () => void;
  onLogout: () => void;
}

export const VipProfileCard = ({
  clientUser,
  latestReservation,
  onGoToMap,
  onLogout,
}: Props) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.12) 0%, rgba(26, 27, 38, 0.95) 100%)',
      border: '1px solid rgba(229, 181, 79, 0.35)',
      borderRadius: '18px',
      padding: '20px',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
      width: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span style={{
            fontSize: '0.62rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <CheckCircle2 size={13} color="var(--state-success)" />
            MEMBRESÍA ACTIVA
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-high)', margin: '4px 0 0' }}>
            {clientUser.name}
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {formatEcuadorPhone(clientUser.phone)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NightflowLogoMark size={22} theme="gold" />
          <span style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(229, 181, 79, 0.2)',
            border: '1px solid rgba(229, 181, 79, 0.4)',
            color: 'var(--gold)',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Crown size={12} />
            <span>{esVipTier(clientUser.tier)}</span>
          </span>
        </div>
      </div>

      {/* Latest active pass if available */}
      {latestReservation && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px dashed rgba(229, 181, 79, 0.3)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={16} color="var(--gold)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-high)', fontWeight: 600 }}>
              Pase Digital: {latestReservation.code}
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--state-success)', fontWeight: 700 }}>ACTIVO</span>
        </div>
      )}

      {/* Direct button to map */}
      <button
        type="button"
        onClick={onGoToMap}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--gold-hover) 0%, var(--gold) 100%)',
          border: 'none',
          color: 'var(--bg-void)',
          fontWeight: 800,
          fontSize: '0.85rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(229, 181, 79, 0.3)',
          marginBottom: '10px',
        }}
      >
        <span>Ver Plano de Mesas y Reservar</span>
        <ArrowRight size={16} />
      </button>

      {/* Beta Feedback button */}
      <button
        id="vip-profile-feedback-btn"
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-beta-feedback'))}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          background: 'rgba(229, 181, 79, 0.08)',
          border: '1px solid rgba(229, 181, 79, 0.28)',
          color: 'var(--gold)',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          marginBottom: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <MessageSquare size={14} />
        <span>Feedback de la Beta VIP</span>
      </button>

      {/* Logout button */}
      <button
        type="button"
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <LogOut size={13} />
        <span>Cerrar sesión de invitado</span>
      </button>
    </div>
  );
};
