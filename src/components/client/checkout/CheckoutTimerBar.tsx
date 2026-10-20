import type { ClubTable } from '../../../types';
import { esTableZone } from '../../../lib/esLabels';
import { TelemetryBadge } from '../../common/ui/TelemetryBadge';

interface Props {
  table: ClubTable;
  timeLeft: number;
}

export const CheckoutTimerBar = ({ table, timeLeft }: Props) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / 720) * 100));
  const isUrgent = timeLeft < 120;

  return (
    <div style={{
      background: isUrgent ? 'var(--state-danger-subtle)' : 'var(--state-hold-subtle)',
      border: `1px solid ${isUrgent ? 'var(--state-danger-border)' : 'var(--state-hold-border)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Progress bar line at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '3px',
        width: `${timerPercentage}%`,
        background: isUrgent ? 'var(--state-danger)' : 'var(--state-hold)',
        boxShadow: `0 0 8px ${isUrgent ? 'var(--state-danger)' : 'var(--state-hold)'}`,
        transition: 'width 1s linear'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: isUrgent ? 'var(--state-danger-text)' : 'var(--state-hold)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Mesa bloqueada temporalmente
          </div>
          <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-high)', marginTop: '2px' }}>
            Mesa {table.table_code} · {esTableZone(table.zone)}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TelemetryBadge
            status={isUrgent ? 'danger' : 'hold'}
            label="BLOQUEO"
            value={formatTime(timeLeft)}
          />
        </div>
      </div>
    </div>
  );
};

