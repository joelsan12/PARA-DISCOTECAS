import type { AuditLog } from '../types';

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    club_id: 'club-sensorial',
    actor: 'Portería principal (anfitriona Camila)',
    role: 'door_staff',
    action: 'CHECK_IN_CONFIRMED',
    details: 'Ingreso confirmado para la reserva VIP-3419 (Valeria Restrepo, mesa 19, 8 personas)',
    timestamp: '2026-09-03 22:42:15'
  },
  {
    id: 'log-2',
    club_id: 'club-sensorial',
    actor: 'Santiago Mendoza',
    role: 'client',
    action: 'RESERVATION_CREATED',
    details: 'Reserva confirmada con un anticipo de USD 250 para la mesa 20',
    timestamp: '2026-09-02 18:20:00'
  },
  {
    id: 'log-3',
    club_id: 'club-sensorial',
    actor: 'Gerente Carlos Ruiz',
    role: 'club_owner',
    action: 'TABLE_PRICE_UPDATE',
    details: 'Actualizó el depósito de la mesa 15 de USD 250 a USD 300 para el Viernes de Perreo',
    timestamp: '2026-09-02 11:05:00'
  },
  {
    id: 'log-4',
    actor: 'Superadministrador Matx',
    role: 'super_admin',
    action: 'PLAN_UPGRADE',
    details: 'Sensorial Club se actualizó al Plan Empresarial',
    timestamp: '2026-08-25 15:30:00'
  }
];
