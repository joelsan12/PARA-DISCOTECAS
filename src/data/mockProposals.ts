import type { ClubProposal } from '../types';

export const INITIAL_PROPOSALS: ClubProposal[] = [
  {
    id: 'prop-sensorial-01',
    club_id: 'club-sensorial',
    club_name: 'Sensorial Club VIP',
    requested_plan_id: 'enterprise',
    title: 'Módulo de División de Cuentas (Split Bill) para Mesas VIP',
    description: 'Nuestros clientes VIP reservan mesas de $500 a $1200 en grupos y solicitan pagar el consumo o anticipo dividido entre varias tarjetas vía link directo.',
    proposed_benefit: 'Aumentará la velocidad de confirmación de mesas en un 35% y evitará fricciones al momento de pagar cuentas compartidas en barra.',
    status: 'IN_REVIEW',
    created_at: '2026-10-01T20:15:00Z',
    dev_response: 'En evaluación técnica de arquitectura: se puede habilitar como módulo modular por webhook de Kushki.'
  },
  {
    id: 'prop-velvet-02',
    club_id: 'club-velvet',
    club_name: 'Velvet Salón y Bar',
    requested_plan_id: 'pro',
    title: 'Upgrade a Plan Pro + Sincronización con Lector de Barras',
    description: 'Queremos pasar de Plan Básico ($149/mes) a Plan Pro ($299/mes) y solicitar que el escáner de puerta pueda alertar a la barra principal cuando un cliente de mesa Diamante ingresa.',
    proposed_benefit: 'Permite al personal de servicio tener la mesa y copa de cortesía listas en menos de 2 minutos tras el check-in.',
    status: 'PENDING',
    created_at: '2026-10-02T14:30:00Z'
  },
  {
    id: 'prop-rumaj-03',
    club_id: 'club-rumaj',
    club_name: 'Rumaj Terraza y Salón',
    requested_plan_id: 'pro',
    title: 'Alertero de Aforo en Terraza Exterior',
    description: 'Propuesta para desplegar un límite diferenciado entre la terraza exterior y el salón interior con notificación instantánea al jefe de seguridad cuando la terraza supere el 90%.',
    proposed_benefit: 'Garantiza cumplimiento con normas de bomberos de Quito y evita multas municipales sin frenar ventas en el salón.',
    status: 'IMPLEMENTED',
    created_at: '2026-09-28T18:00:00Z',
    updated_at: '2026-09-30T11:20:00Z',
    dev_response: 'Módulo personalizado implementado y activado exclusivamente para Rumaj Terraza y Salón con regla de aforo zonal.',
    activated_feature: {
      id: 'feat-rumaj-zone-alert',
      name: 'Alertero de Aforo Zonal en Terraza',
      key: 'ZONE_CAPACITY_ALERT',
      description: 'Disparo de alertas push al jefe de seguridad cuando la zona de terraza exterior alcanza el umbral configurado.',
      enabled: true,
      activated_at: '2026-09-30T11:20:00Z',
      activated_by: 'Desarrollador (SuperAdmin)',
      notes: 'Activado con webhook a terminal de seguridad de Rumaj'
    }
  }
];
