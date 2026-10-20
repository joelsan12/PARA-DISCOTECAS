import {
  MonitorPlay,
  ScanLine,
  Crown,
  Wine,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import type { TelemetryStatus } from '../../common/ui';

/* ═════════════════════════════════════════════════════════════════════════
   NIGHTFLOW VIP — BENTO DE CONSOLA (datos de los 5 módulos beta)
   Fuente única de verdad compartida por la sección inline del landing
   (SaasBetaPlaygroundSection) y el modal de bienvenida (SaasBetaWelcomeModal).
   ═════════════════════════════════════════════════════════════════════════ */

export type BetaModuleDomain = 'floor' | 'door' | 'client' | 'waiter' | 'arch';
export type BetaModulePreview = 'floorplan' | 'scanner' | 'blackcard' | 'ticket' | 'blueprint';

export interface BetaModuleSpec {
  label: string;
  value: string;
}

export interface BetaModule {
  id: string;
  channel: string;
  name: string;
  roleTag: string;
  domain: BetaModuleDomain;
  preview: BetaModulePreview;
  icon: LucideIcon;
  desc: string;
  features: string[];
  spec: BetaModuleSpec[];
  badge: string;
  badgeStatus: TelemetryStatus;
  primaryLink: string;
  primaryLabel: string;
}

export const BETA_MODULES: BetaModule[] = [
  {
    id: 'floor-ops',
    channel: 'MOD-01',
    name: 'Cockpit de Sala & Mapa Cenital',
    roleTag: 'Manager & Barra',
    domain: 'floor',
    preview: 'floorplan',
    icon: MonitorPlay,
    desc: 'Supervisión táctica de sala en tiempo real: ocupación de palcos VIP, consumos mínimos acumulados y despacho de botellería sin fricción.',
    features: [
      'Plano cenital interactivo con código de estados (Libre, Hold, Ocupado, VIP)',
      'Control de consumo acumulado vs. consumo mínimo garantizado por mesa',
      'Alertas de servicio prioritario y llamadas de concierge VIP al instante',
    ],
    spec: [
      { label: 'HOLD', value: '12 MIN' },
      { label: 'AFORO', value: 'LIVE 71%' },
      { label: 'BARRA', value: 'SYNC < 20ms' },
    ],
    badge: 'EN VIVO',
    badgeStatus: 'success',
    primaryLink: '/software/pantallas',
    primaryLabel: 'Abrir Consola',
  },
  {
    id: 'door-scanner',
    channel: 'MOD-02',
    name: 'Terminal de Puerta Criptográfica',
    roleTag: 'Puerta & Seguridad',
    domain: 'door',
    preview: 'scanner',
    icon: ScanLine,
    desc: 'Validación óptica de pases en 0.04s. Detección infalible de capturas de pantalla reenviadas y firma de hardware Ed25519.',
    features: [
      'Firma asimétrica verificada en hardware con clave pública (< 50ms)',
      'Protección anti-screenshot con token rotativo efímero de 30s',
      'Operación offline 100% con sincronización transaccional en cola cifrada',
    ],
    spec: [
      { label: 'LATENCIA', value: '0.04S' },
      { label: 'ENCLAVE', value: 'Ed25519' },
      { label: 'OFFLINE', value: 'BUFFER IDB' },
    ],
    badge: 'KMS ED25519',
    badgeStatus: 'success',
    primaryLink: '/software/simulador',
    primaryLabel: 'Probar Escáner',
  },
  {
    id: 'vip-client',
    channel: 'MOD-03',
    name: 'Portal del Invitado & Black Card Pass',
    roleTag: 'Experiencia VIP',
    domain: 'client',
    preview: 'blackcard',
    icon: Crown,
    desc: 'El cliente reserva su palco directamente en el plano interactivo, bloquea su stock por 12 minutos y obtiene su Black Card rotativa.',
    features: [
      'Selección táctil de mesa en mapa cenital con consumo mínimo garantizado',
      'Hold transaccional estricto de 12 minutos que previene sobreventas',
      'Pase Black Card con QR dinámico y validación biométrica Passkey',
    ],
    spec: [
      { label: 'QR ROT', value: '30S' },
      { label: 'TTL JWS', value: '45S' },
      { label: 'PASSKEY', value: 'WEBAUTHN' },
    ],
    badge: 'BLACK VIP',
    badgeStatus: 'gold',
    primaryLink: '/negocios',
    primaryLabel: 'Probar Reserva',
  },
  {
    id: 'waiter-terminal',
    channel: 'MOD-04',
    name: 'Terminal PWA de Meseros & Barra',
    roleTag: 'Servicio & Botellas',
    domain: 'waiter',
    preview: 'ticket',
    icon: Wine,
    desc: 'Comandas instantáneas de botellería premium directo a barra, control del gasto mínimo de la mesa y cobro fraccionado.',
    features: [
      'Despacho inmediato de licores y botellas VIP a barra sin tickets de papel',
      'Barra de progreso de consumo mínimo en tiempo real por cada palco',
      'Cierre asistido de cuenta con división automática por cliente o mesa',
    ],
    spec: [
      { label: 'DESPACHO', value: '< 1 SEG' },
      { label: 'MIN SPEND', value: 'TRACK LIVE' },
      { label: 'RED LOCAL', value: 'OFFLINE SYNC' },
    ],
    badge: 'PWA ULTRA',
    badgeStatus: 'gold',
    primaryLink: '/software/pantallas',
    primaryLabel: 'Ver Meseros',
  },
  {
    id: 'blueprint-editor',
    channel: 'MOD-05',
    name: 'Estudio CAD de Arquitectura de Sala',
    roleTag: 'Diseño del Club',
    domain: 'arch',
    preview: 'blueprint',
    icon: LayoutGrid,
    desc: 'Diseña la distribución métrica de tu club: palcos VIP, suites privadas, barras 360°, cabina DJ y aforos por zona.',
    features: [
      'Dibujo vectorial escalado con medidas reales del establecimiento',
      'Asignación granular de consumos mínimos y tarifas por temporada',
      'Aislamiento multi-tenant 100% privado y exportación reactiva',
    ],
    spec: [
      { label: 'PRECISIÓN', value: 'MÉTRICA' },
      { label: 'TENANT', value: 'AISLADO' },
      { label: 'PRESETS', value: '5 NIVELES' },
    ],
    badge: 'CAD BLUEPRINT',
    badgeStatus: 'gold',
    primaryLink: '/software/arquitectura',
    primaryLabel: 'Ver Arquitectura',
  },
];
