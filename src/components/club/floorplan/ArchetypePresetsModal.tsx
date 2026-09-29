import React from 'react';
import type { ClubLayoutType } from '../../../types';
import { X, Sparkles, Check, Building2 } from 'lucide-react';
import { formatUsd } from '../../../lib/formatUsd';
import { esLayout, esPlan } from '../../../lib/esLabels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: ClubLayoutType;
  onSelectPreset: (preset: ClubLayoutType) => void;
  onRequestCustomPlan: () => void;
}

interface ArchetypeCard {
  id: ClubLayoutType;
  title: string;
  badge: string;
  description: string;
  features: string[];
  recommendedFor: string;
  icon: string;
}

const ARCHETYPES: ArchetypeCard[] = [
  {
    id: 'horseshoe_vip',
    title: `${esLayout('horseshoe_vip')} y sala principal`,
    badge: 'Totalmente simétrico',
    icon: '🏛️',
    description: 'Distribución en U con balcón VIP panorámico superior, pista central despejada y cabina del DJ frontal.',
    features: ['Balcón ultravip elevado (4 mesas)', 'Palcos laterales simétricos', 'Pista central libre de obstáculos', 'Espacios privados junto a la cabina del DJ'],
    recommendedFor: 'Grandes discotecas, macro-salas y clubes nocturnos con zona VIP perimetral.'
  },
  {
    id: 'u_amphitheater',
    title: `${esLayout('u_amphitheater')} tipo estadio`,
    badge: 'Varios niveles',
    icon: '🏟️',
    description: 'Estructura concéntrica en gradas escalonadas con escenario frontal para espectáculos y mesas de cóctel.',
    features: ['Escenario central frontal', 'Graderías VIP en varios niveles', 'Mesas de salón y de cóctel', 'Acceso directo a la barra'],
    recommendedFor: 'Salas de conciertos, clubes con presentaciones en vivo y teatros reconvertidos.'
  },
  {
    id: 'downtown_suites',
    title: `${esLayout('downtown_suites')} con vista panorámica`,
    badge: 'Reservas privadas',
    icon: '🍸',
    description: 'Suites privadas exclusivas con balcones panorámicos, terraza exterior para baile y barra con vista a la ciudad.',
    features: ['Suites VIP cerradas con atención privada', 'Terraza exterior para baile', 'Barra de cóctel panorámica', 'Acceso por ascensores VIP'],
    recommendedFor: 'Azoteas, terrazas de hotel de lujo y salones con reservas privadas.'
  },
  {
    id: 'custom_open',
    title: `${esLayout('custom_open')} y abierto`,
    badge: 'Espacio abierto',
    icon: '📐',
    description: 'Cuadrícula arquitectónica abierta lista para arrastrar mesas y adaptarse a planos singulares.',
    features: ['Distribución totalmente flexible', 'Cuadrícula con ajuste láser al 1 %', 'Capacidades y formas libres', 'Ideal para planos personalizados'],
    recommendedFor: 'Establecimientos con arquitectura atípica o distribuciones cambiantes.'
  }
];

export const ArchetypePresetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLayout,
  onSelectPreset,
  onRequestCustomPlan
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '920px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid rgba(229, 181, 79, 0.25)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h2 className="font-brand" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Plantillas de Arquetipos Arquitectónicos (Planos Cenitales)
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Elige una plantilla para transformar la distribución cenital de tu local al instante, o personalízala arrastrando mesas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Archetype Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {ARCHETYPES.map(arch => {
            const isCurrent = currentLayout === arch.id;
            return (
              <div
                key={arch.id}
                style={{
                  background: isCurrent ? 'rgba(229, 181, 79, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: isCurrent ? '1.5px solid #e5b54f' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{arch.icon}</span>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isCurrent ? 'rgba(229, 181, 79, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: isCurrent ? '#e5b54f' : 'var(--text-muted)'
                    }}>
                      {arch.badge}
                    </span>
                  </div>

                  <h3 className="font-brand" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                    {arch.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                    {arch.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                    {arch.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-main)' }}>
                        <Check size={12} color="#e5b54f" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    💡 {arch.recommendedFor}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(arch.id);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: isCurrent ? 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 100%)' : 'rgba(255, 255, 255, 0.08)',
                    color: isCurrent ? '#08080c' : '#fff',
                    border: isCurrent ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isCurrent ? '✓ Plantilla en uso' : 'Cargar esta plantilla'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Floor Plan Service Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(229, 181, 79, 0.12) 0%, rgba(20, 22, 34, 0.8) 100%)',
          border: '1.5px solid rgba(229, 181, 79, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={16} color="#e5b54f" />
              <h3 className="font-brand" style={{ fontSize: '1rem', fontWeight: 800, color: '#e5b54f', margin: 0 }}>
                ¿Tu local tiene una arquitectura única o plano propio?
              </h3>
              <span style={{
                fontSize: '0.65rem',
                background: 'rgba(229, 181, 79, 0.2)',
                color: '#e5b54f',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 800
              }}>
                SERVICIO A MEDIDA
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.45', margin: 0 }}>
              Si tienes fotos, croquis o el plano de evacuación de tu discoteca, nuestro equipo de soporte técnico modela tu mapa interactivo a escala real con simetría VIP.
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(229, 181, 79, 0.9)', marginTop: '4px', fontWeight: 600 }}>
              * Disponible en planes con mapa interactivo ({esPlan('pro')} o {esPlan('enterprise')}). Cobro único de configuración aparte: <strong>{formatUsd(49)}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestCustomPlan();
            }}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 100%)',
              color: '#08080c',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(229, 181, 79, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={16} />
            <span>Solicitar plano a medida ({formatUsd(49)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
