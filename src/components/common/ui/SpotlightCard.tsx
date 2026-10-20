import React, { useRef, type ComponentPropsWithoutRef } from 'react';

export interface SpotlightCardProps extends ComponentPropsWithoutRef<'div'> {
  spotlightColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  spotlightColor,
  className = '',
  children,
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--spotlight-opacity', '0');
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...(spotlightColor ? ({ '--spotlight-color': spotlightColor } as React.CSSProperties) : {}),
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
