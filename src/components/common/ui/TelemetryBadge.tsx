import React, { type ComponentPropsWithoutRef } from 'react';

export type TelemetryStatus = 'gold' | 'success' | 'danger' | 'hold' | 'none';

export interface TelemetryBadgeProps extends ComponentPropsWithoutRef<'span'> {
  status?: TelemetryStatus;
  label: string;
  value?: string | number;
  className?: string;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({
  status = 'gold',
  label,
  value,
  className = '',
  ...props
}) => {
  return (
    <span className={`telemetry-badge ${className}`.trim()} {...props}>
      {status !== 'none' && (
        <span
          className={`telemetry-led telemetry-led-${status}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
      {value !== undefined && value !== null && (
        <strong style={{ color: 'var(--text-high)' }}>{value}</strong>
      )}
    </span>
  );
};
