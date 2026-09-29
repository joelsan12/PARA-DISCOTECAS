import { Check } from 'lucide-react';
import { formatUsd } from '../../lib/formatUsd';
import { esPlan } from '../../lib/esLabels';
import type { SubscriptionPlan } from '../../types';

const featureLabels: Record<string, string> = {
  'Web Pública de Reservas': 'Sitio público de reservas',
  'Formulario Directo a WhatsApp': 'Formulario directo a WhatsApp',
  'Gestión de Eventos': 'Gestión de eventos',
  'Sin Mapa Interactivo (Solo Lista Estándar)': 'Sin mapa interactivo (solo lista estándar)',
  'Soporte Estándar': 'Soporte estándar',
  'Todo lo del Plan Silver': `Todo lo del plan ${esPlan('basic').toLowerCase()}`,
  'Mapa Visual Interactivo con Plantillas Cenitales': 'Mapa visual interactivo con plantillas cenitales',
  'Editor de Mesas y Arquetipos Arquitectónicos': 'Editor de mesas y arquetipos arquitectónicos',
  'Control de Puerta con Escáner QR': 'Control de puerta con escáner QR',
  'Precios Dinámicos por Evento': 'Precios dinámicos por evento',
  'Hold de Concurrencia (10 min)': 'Bloqueo temporal de concurrencia (10 min)',
  'Todo lo del Plan Gold': `Todo lo del plan ${esPlan('pro').toLowerCase()}`,
  'Plano Cenital a Medida Modelado por Soporte Técnico': 'Plano cenital a medida modelado por soporte técnico',
  'Auditoría Total en Vivo & Concierge VIP': 'Auditoría total en vivo y atención VIP',
  'Módulo de Butacas & Entradas Generales': 'Módulo de butacas y entradas generales',
  'Dominio Personalizado': 'Dominio personalizado',
  'Multi-promotores & RRPP': 'Promotores múltiples y RRPP',
  'Soporte VIP 24/7 con Arquitecto Dedicado': 'Soporte VIP 24/7 con arquitecto dedicado',
};

const formatFeature = (feature: string) => {
  const normalized = feature.trim();
  if (
    normalized.startsWith('Opción de Solicitar Plano a Medida por Soporte') ||
    normalized === 'Solicitud de plano a medida por soporte'
  ) {
    return `Solicitud de plano a medida por soporte (${formatUsd(49)})`;
  }
  return featureLabels[normalized] ?? normalized;
};

interface Props {
  plans: SubscriptionPlan[];
}

export const SubscriptionPlansList = ({ plans }: Props) => {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 className="font-brand" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
        Modelos de suscripción para discotecas
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
        Límites configurables de mesas, aforo y comisiones de procesamiento
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {plans.map(p => (
          <div
            key={p.id}
            style={{
              background: p.id === 'pro' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${p.id === 'pro' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 className="font-brand" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{esPlan(p.id)}</h4>
              {p.id === 'pro' && (
                <span className="badge badge-available">Más popular</span>
              )}
            </div>

            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
              {formatUsd(p.monthly_price)} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ mes</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="var(--accent)" />
                <span>Hasta {p.max_events_per_month} eventos mensuales</span>
              </div>
              {p.features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="var(--accent)" />
                  <span>{formatFeature(feat)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
