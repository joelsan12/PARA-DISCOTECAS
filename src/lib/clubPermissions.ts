import type { Club, Plan, FeatureFlag } from '../types';
import type { DashboardTabKey } from '../components/club/AdminSidebar';

/**
 * Normaliza cualquier identificador o alias de plan a su clave canónica interna.
 * Tolera mayúsculas, espacios ("Beta Privada VIP", "Plan Beta Privada"), guiones y aliases.
 */
export function normalizeCanonicalPlanId(raw?: string): string {
  if (!raw) return 'beta_vip';
  const clean = raw.trim().toLowerCase().replace(/[-_]/g, ' ');
  if (clean.includes('enterprise') || clean.includes('empresarial')) return 'enterprise';
  if (clean.includes('black')) return 'black_vip';
  if (clean.includes('beta')) return 'beta_vip';
  if (clean.includes('club pro') || clean === 'pro' || clean.includes('profesional')) return 'club_pro';
  if (clean.includes('starter')) return 'starter';
  if (clean.includes('basic') || clean.includes('basico') || clean.includes('básico')) return 'basic';
  if (clean.includes('free') || clean.includes('lounge')) return 'free';
  return clean.replace(/\s+/g, '_');
}

/**
 * Valida si un club tiene acceso a una característica específica,
 * considerando:
 * 1. Beneficios/características exclusivas VIP otorgadas por soporte/desarrollo (custom_features).
 * 2. Overrides a nivel de club (enabled_features).
 * 3. Características activas en el Plan de suscripción contratado (plan.enabled_features).
 */
export function canClubAccessFeature(
  club: Club | undefined,
  plan: Plan | undefined,
  feature: FeatureFlag,
  customKeyAliases: string[] = []
): boolean {
  if (!club) return false;

  // 1. Beneficio exclusivo concedido por soporte/desarrollo (custom_features)
  if (club.custom_features && club.custom_features.length > 0) {
    const hasCustom = club.custom_features.some(f =>
      f.enabled && (
        f.key.toUpperCase() === feature ||
        customKeyAliases.some(alias => alias.toLowerCase() === f.key.toLowerCase())
      )
    );
    if (hasCustom) return true;
  }

  // 2. Features explícitos a nivel de club
  if (club.enabled_features && club.enabled_features.includes(feature)) {
    return true;
  }

  // 3. Features habilitados en el plan contratado
  if (plan?.enabled_features && plan.enabled_features.includes(feature)) {
    return true;
  }

  // 4. Fallback canónico por tier de plan (insensible a mayúsculas, espacios y aliases como 'Beta Privada VIP')
  const planId = normalizeCanonicalPlanId(club.plan_id);
  if (planId === 'enterprise' || planId === 'beta_vip' || planId === 'black_vip') {
    return true; // Plan Empresarial, Beta Privada VIP y Black VIP disponen de todas las capacidades operativas
  }
  if (planId === 'pro' || planId === 'club_pro') {
    const proAllowed: FeatureFlag[] = [
      'RESERVATIONS',
      'EVENTS',
      'FLOOR_PLAN',
      'TABLE_SELECTION',
      'ONLINE_PAYMENT',
      'QR_CHECKIN',
      'STAFF_MANAGEMENT',
    ];
    return proAllowed.includes(feature);
  }
  if (planId === 'starter') {
    const starterAllowed: FeatureFlag[] = [
      'RESERVATIONS',
      'EVENTS',
      'FLOOR_PLAN',
      'TABLE_SELECTION',
      'QR_CHECKIN',
    ];
    return starterAllowed.includes(feature);
  }
  if (planId === 'basic' || planId === 'free') {
    const basicAllowed: FeatureFlag[] = ['RESERVATIONS', 'EVENTS'];
    return basicAllowed.includes(feature);
  }

  return false;
}

/**
 * Valida si una pestaña operativa del panel de administración está habilitada
 * según el plan contratado por el club o sus beneficios exclusivos.
 */
export function isDashboardTabAllowed(
  tab: DashboardTabKey,
  club: Club | undefined,
  plan: Plan | undefined
): boolean {
  if (!club) return false;

  switch (tab) {
    case 'MONITOR':
      // Sala en Vivo: Centro operativo básico disponible para todo club activo
      return true;

    case 'LAYOUT_BUILDER':
      // Diseñador de Plano & Mesas: Requiere Plan Pro o Empresarial (FLOOR_PLAN)
      return canClubAccessFeature(
        club,
        plan,
        'FLOOR_PLAN',
        ['floor_plan', 'disenador_plano', 'editor_mesas', 'mapa_interactivo']
      );

    case 'EVENTS':
      // Cartelera de Eventos: Básico, Pro, Empresarial o Beta VIP
      return canClubAccessFeature(club, plan, 'EVENTS', ['events', 'eventos', 'cartelera']);

    case 'RESERVATIONS':
      // Reservas Activas: Básico, Pro o Empresarial
      return canClubAccessFeature(club, plan, 'RESERVATIONS', ['reservas']);

    case 'PRICING':
      // Tarifario & Anticipos: Requiere Plan Pro o Empresarial (TABLE_SELECTION / dynamic pricing)
      return canClubAccessFeature(
        club,
        plan,
        'TABLE_SELECTION',
        ['dynamic_pricing', 'pricing', 'tarifario', 'anticipos']
      );

    case 'PAYMENTS':
      // Pasarela Kushki: Requiere Plan Pro o Empresarial (ONLINE_PAYMENT)
      return canClubAccessFeature(
        club,
        plan,
        'ONLINE_PAYMENT',
        ['online_payment', 'kushki_gateway', 'pasarela_kushki', 'pagos']
      );

    case 'LEGAL':
      // Identidad Legal SRI: Siempre visible (perfil fiscal y facturación del negocio)
      return true;

    case 'AUDIT':
      // Bitácora de Auditoría: Exclusiva de Plan Empresarial (ADVANCED_ANALYTICS)
      return canClubAccessFeature(
        club,
        plan,
        'ADVANCED_ANALYTICS',
        ['advanced_analytics', 'auditoria', 'audit_log', 'bitacora_auditoria']
      );

    case 'SUBSCRIPTION':
      // Mi Plan & Propuestas: Siempre visible para consultar suscripción y solicitar upgrades
      return true;

    default:
      return false;
  }
}

/**
 * Valida si el control de puerta QR está habilitado para el plan del club.
 */
export function isDoorAccessAllowed(
  club: Club | undefined,
  plan: Plan | undefined
): boolean {
  return canClubAccessFeature(club, plan, 'QR_CHECKIN', ['qr_checkin', 'puerta_qr', 'scanner']);
}

/**
 * Valida si un rol de staff o superadministrador tiene permisos para emitir
 * reembolsos transaccionales en la pasarela de pagos (AGENTS Fase C).
 * Requiere rol finance, manager u owner; bloquea a door.
 */
export function canStaffRefund(staffRole?: string, isSuperAdmin?: boolean): boolean {
  if (isSuperAdmin === true) return true;
  if (!staffRole) return false;
  const role = staffRole.toLowerCase();
  return role === 'finance' || role === 'manager' || role === 'owner';
}
