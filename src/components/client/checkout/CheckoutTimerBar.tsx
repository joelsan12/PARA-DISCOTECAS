import { Clock } from 'lucide-react';
import type { ClubTable } from '../../../types';
import { esTableZone } from '../../../lib/esLabels';

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
      background: isUrgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.1)',
      border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
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
        background: isUrgent ? '#ef4444' : '#f59e0b',
        boxShadow: `0 0 8px ${isUrgent ? '#ef4444' : '#f59e0b'}`,
        transition: 'width 1s linear'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isUrgent ? '#fca5a5' : '#fde68a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mesa bloqueada temporalmente
          </div>
          <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
            Mesa {table.table_code} · {esTableZone(table.zone)}
          </h3>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Clock size={15} color={isUrgent ? '#ef4444' : '#f59e0b'} />
          <span className="font-mono" style={{
            fontWeight: 800,
            fontSize: '1rem',
            color: isUrgent ? '#ef4444' : '#f59e0b'
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
};
