import React, { type ComponentPropsWithoutRef } from 'react';

export interface BorderBeamProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  children: React.ReactNode;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div className={`border-beam-container ${className}`.trim()} style={style} {...props}>
      <div className="border-beam-line" aria-hidden="true" />
      <div className="border-beam-content">
        {children}
      </div>
    </div>
  );
};
