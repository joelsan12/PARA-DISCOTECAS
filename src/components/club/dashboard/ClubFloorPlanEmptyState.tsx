import React from 'react';
import { LayoutGrid, Sparkles, Plus, FileUp, CheckCircle2, Clock, Lock } from 'lucide-react';

interface Props {
  clubName: string;
  onGoToDesigner: () => void;
  onRequestCustomPlan: () => void;
}

export const ClubFloorPlanEmptyState: React.FC<Props> = ({
  clubName,
  onGoToDesigner,
  onRequestCustomPlan,
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '48px 36px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(16, 17, 26, 0.96) 0%, rgba(10, 11, 16, 0.98) 100%)',
        border: '1px solid rgba(229, 181, 79, 0.25)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Icono de bienvenida */}
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.2) 0%, rgba(229, 181, 79, 0.05) 100%)',
          border: '1px solid rgba(229, 181, 79, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--brand-gold)',
          boxShadow: '0 8px 24px rgba(229, 181, 79, 0.15)',
        }}
      >
        <LayoutGrid size={34} />
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '999px', background: 'rgba(229, 181, 79, 0.12)', border: '1px solid rgba(229, 181, 79, 0.3)', marginBottom: '14px' }}>
        <Sparkles size={12} color="var(--brand-gold)" />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--brand-gold)', textTransform: 'uppercase' }}>
          CLUB NUEVO • SALA EN BLANCO
        </span>
      </div>

      <h2
        className="font-brand"
        style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          color: '#ffffff',
          margin: '0 0 10px',
          letterSpacing: '-0.01em',
        }}
      >
        Bienvenido a {clubName}
      </h2>

      <p
        style={{
          fontSize: '0.92rem',
          color: 'var(--text-dim)',
          maxWidth: '560px',
          margin: '0 auto 32px',
          lineHeight: 1.6,
        }}
      >
        Tu establecimiento está activo y listo para operar. Al ser una cuenta nueva, aún no tiene mesas ni plano cargado. Elige cómo deseas comenzar:
      </p>

      {/* Grid de opciones */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          maxWidth: '680px',
          margin: '0 auto 36px',
          textAlign: 'left',
        }}
      >
        {/* Opción 1: Diseñador */}
        <div
          onClick={onGoToDesigner}
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid rgba(229, 181, 79, 0.3)',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand-gold)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(229, 181, 79, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(229, 181, 79, 0.3)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(229, 181, 79, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-gold)',
                marginBottom: '14px',
              }}
            >
              <Plus size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
              Diseñar Plano de Mesas
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              Crea tu distribución arrastrando mesas VIP, zonas estándar, barras y pista de baile con el editor visual.
            </p>
          </div>
          <button
            type="button"
            className="btn-gold"
            style={{ width: '100%', marginTop: '18px', padding: '10px 16px' }}
          >
            Abrir Diseñador →
          </button>
        </div>

        {/* Opción 2: Asistencia con Croquis */}
        <div
          onClick={onRequestCustomPlan}
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e2e8f0',
                marginBottom: '14px',
              }}
            >
              <FileUp size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
              Subir Croquis Arquitectónico
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              ¿Tienes una foto o plano en PDF? Envíanoslo y nuestro equipo técnico dibujará tu sala en 24h.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', marginTop: '18px', padding: '10px 16px' }}
          >
            Subir Croquis a Soporte VIP
          </button>
        </div>
      </div>

      {/* Checklist de Inicio Rápido */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '24px',
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} color="#34d399" />
          <span>1. Cuenta y Club Creados</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--brand-gold)" />
          <span style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>2. Diseñar Plano de Sala</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={14} color="rgba(255, 255, 255, 0.3)" />
          <span>3. Definir Consumos Mínimos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={14} color="rgba(255, 255, 255, 0.3)" />
          <span>4. Operar Puerta QR</span>
        </div>
      </div>
    </div>
  );
};
