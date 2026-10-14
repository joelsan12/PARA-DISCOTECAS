import React from 'react';
import type { ClubLayoutType } from '../../../types';
import { X, Sparkles, Check, Building2, LayoutTemplate, Grid, Wine, Layers } from 'lucide-react';
import { formatUsd } from '../../../lib/formatUsd';
import { esLayout, esPlan } from '../../../lib/esLabels';
import { ArchetypeBlueprintPreview } from './ArchetypeBlueprintPreview';

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
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const ARCHETYPES: ArchetypeCard[] = [
  {
    id: 'horseshoe_vip',
    title: `${esLayout('horseshoe_vip')} y sala principal`,
    badge: '12 mesas · Simetría VIP',
    icon: Layers,
    description: 'Distribución en U con balcón VIP panorámico superior, pista central despejada y cabina del DJ frontal.',
    features: ['Balcón ultravip elevado (4 mesas)', 'Palcos laterales simétricos', 'Pista central libre de obstáculos', 'Espacios privados junto a la cabina del DJ'],
    recommendedFor: 'Grandes discotecas, macro-salas y clubes nocturnos con zona VIP perimetral.'
  },
  {
    id: 'u_amphitheater',
    title: `${esLayout('u_amphitheater')} tipo estadio`,
    badge: '14 mesas · Varios niveles',
    icon: LayoutTemplate,
    description: 'Estructura concéntrica en gradas escalonadas con escenario frontal para espectáculos y mesas de cóctel.',
    features: ['Escenario central frontal', 'Graderías VIP en varios niveles', 'Mesas de salón y de cóctel', 'Acceso directo a la barra'],
    recommendedFor: 'Salas de conciertos, clubes con presentaciones en vivo y teatros reconvertidos.'
  },
  {
    id: 'downtown_suites',
    title: `${esLayout('downtown_suites')} con vista panorámica`,
    badge: '12 mesas · Reservas privadas',
    icon: Wine,
    description: 'Suites privadas exclusivas con balcones panorámicos, terraza exterior para baile y barra con vista a la ciudad.',
    features: ['Suites VIP cerradas con atención privada', 'Terraza exterior para baile', 'Barra de cóctel panorámica', 'Acceso por ascensores VIP'],
    recommendedFor: 'Azoteas, terrazas de hotel de lujo y salones con reservas privadas.'
  },
  {
    id: 'custom_open',
    title: `${esLayout('custom_open')} (Lienzo en Blanco)`,
    badge: '0 mesas · Espacio libre',
    icon: Grid,
    description: 'Cuadrícula arquitectónica abierta sin mesas prefijadas. Ideal para diseñar la sala desde cero con total libertad.',
    features: ['Distribución totalmente flexible', 'Cuadrícula con ajuste láser al 1 %', 'Sin mesas forzadas de entrada', 'Ideal para planos personalizados'],
    recommendedFor: 'Establecimientos con arquitectura atípica, salas nuevas o distribuciones libres.'
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
        maxWidth: '960px',
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
              <LayoutTemplate size={22} color="var(--brand-gold)" />
              <h2 className="font-brand" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-high, #fff)', margin: 0 }}>
                Plantillas de Arquetipos Arquitectónicos
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Previsualiza la distribución de cada plano antes de aplicarlo a tu local, o comienza con un lienzo en blanco.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn-ghost"
            style={{
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Archetype Cards Grid with Visual Previews */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {ARCHETYPES.map(arch => {
            const isCurrent = currentLayout === arch.id;
            const IconComp = arch.icon;
            return (
              <div
                key={arch.id}
                style={{
                  background: isCurrent ? 'var(--accent-subtle, rgba(229, 181, 79, 0.08))' : 'var(--bg-elevated, rgba(255, 255, 255, 0.03))',
                  border: isCurrent ? '1.5px solid var(--brand-gold, #e5b54f)' : '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Visual Blueprint Preview */}
                  <div style={{ marginBottom: '12px' }}>
                    <ArchetypeBlueprintPreview layoutType={arch.id} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isCurrent ? 'rgba(229, 181, 79, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCurrent ? 'var(--brand-gold)' : 'var(--text-main)'
                    }}>
                      <IconComp size={16} />
                    </div>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isCurrent ? 'rgba(229, 181, 79, 0.25)' : 'var(--accent-subtle, rgba(255, 255, 255, 0.08))',
                      color: isCurrent ? 'var(--brand-gold, #e5b54f)' : 'var(--text-muted)'
                    }}>
                      {arch.badge}
                    </span>
                  </div>

                  <h3 className="font-brand" style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-high, #fff)', marginBottom: '6px' }}>
                    {arch.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '10px' }}>
                    {arch.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                    {arch.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-main)' }}>
                        <Check size={12} color="var(--brand-gold, #e5b54f)" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                    {arch.recommendedFor}
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
                    background: isCurrent ? 'linear-gradient(135deg, #f5d38a 0%, #e5b54f 100%)' : 'var(--bg-elevated, rgba(255, 255, 255, 0.08))',
                    color: isCurrent ? '#08080c' : 'var(--text-high, #fff)',
                    border: isCurrent ? 'none' : '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginTop: '8px'
                  }}
                >
                  {isCurrent ? '✓ Plantilla en uso' : arch.id === 'custom_open' ? 'Usar lienzo en blanco' : 'Cargar esta plantilla'}
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
