const tableZoneLabels: Record<string, string> = {
  'VIP Stage': 'Escenario VIP',
  'Dance Floor': 'Pista de baile',
  'DJ Booth': 'Cabina del DJ',
  'Terrace Lounge': 'Terraza',
  'Suites VIP': 'Suites VIP',
  Palco: 'Escenario',
  Platinum: 'Platino',
  Gold: 'Oro',
  Silver: 'Plata',
  'Palcos VIP': 'Palcos VIP',
  'Balcón Ultra VIP': 'Balcón Ultra VIP',
  'Pista VIP': 'Pista VIP',
  'Cabina DJ VIP': 'Cabina DJ VIP',
  'Escenario VIP': 'Escenario VIP',
  'Pista de baile': 'Pista de baile',
  'Cabina del DJ': 'Cabina del DJ',
  Terraza: 'Terraza',
  Platino: 'Platino',
  Oro: 'Oro',
  Plata: 'Plata',
};

const tableStatusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  HELD: 'Bloqueada temporalmente',
  CONFIRMED: 'Reservada',
  CHECKED_IN: 'Ingreso registrado',
  EXPIRED: 'Vencida',
};

const vipTierLabels: Record<string, string> = {
  SILVER: 'Plata',
  GOLD_VIP: 'Oro VIP',
  BLACK_DIAMOND: 'Diamante Negro',
};

const roleLabels: Record<string, string> = {
  CLIENT: 'Cliente',
  CLUB_ADMIN: 'Administrador del club',
  CLUB_OWNER: 'Propietario del club',
  DOOR_CHECKIN: 'Personal de puerta',
  SUPER_ADMIN: 'Superadministrador',
  super_admin: 'Superadministrador',
  club_owner: 'Propietario del club',
  door_staff: 'Personal de puerta',
  client: 'Cliente',
  system: 'Sistema',
};

const planLabels: Record<string, string> = {
  basic: 'Básico',
  BASIC: 'Básico',
  pro: 'Profesional',
  PRO: 'Profesional',
  enterprise: 'Empresarial',
  ENTERPRISE: 'Empresarial',
};

const clubStatusLabels: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  trial: 'Período de prueba',
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  transfer: 'Transferencia bancaria',
  cash_door: 'Pago en puerta',
};

const auditActionLabels: Record<string, string> = {
  CLIENT_LOGIN: 'Inicio de sesión de cliente',
  STAFF_LOGIN_2FA: 'Acceso de personal con doble verificación',
  RESERVATION_CONFIRMED: 'Reserva confirmada',
  QR_CHECKED_IN: 'Ingreso validado por QR',
  PRESET_APPLIED: 'Plantilla aplicada',
  TENANT_CREATED: 'Cliente empresarial creado',
  CLUB_UPDATED: 'Club actualizado',
  CLUB_STATUS_UPDATED: 'Estado del club actualizado',
  PLAN_UPDATED: 'Plan actualizado',
  CHECK_IN_CONFIRMED: 'Ingreso confirmado',
  RESERVATION_CREATED: 'Reserva creada',
  TABLE_PRICE_UPDATE: 'Precios de mesa actualizados',
  PLAN_UPGRADE: 'Plan mejorado',
};

const venueTypeLabels: Record<string, string> = {
  BAR: 'Bar',
  NIGHTCLUB: 'Discoteca',
  RESTAURANT: 'Restaurante',
  LOUNGE: 'Salón privado',
  ROOFTOP: 'Terraza',
  THEATER: 'Teatro',
  SPORTS_CLUB: 'Club deportivo',
  EVENT_VENUE: 'Recinto de eventos',
  OTHER: 'Otro',
};

const layoutLabels: Record<string, string> = {
  horseshoe_vip: 'Herradura VIP',
  u_amphitheater: 'Anfiteatro en U',
  downtown_suites: 'Suites Urbanas',
  custom_open: 'Plano personalizado',
};

const fallbackLabel = (value: string) => value
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/(^|\s)\p{L}/gu, character => character.toUpperCase());

export const esTableZone = (value: string) => tableZoneLabels[value] ?? fallbackLabel(value);
export const esTableStatus = (value: string) => tableStatusLabels[value] ?? fallbackLabel(value);
export const esVipTier = (value: string) => vipTierLabels[value] ?? fallbackLabel(value);
export const esRole = (value: string) => roleLabels[value] ?? fallbackLabel(value);
export const esPlan = (value: string) => planLabels[value] ?? fallbackLabel(value);
export const esClubStatus = (value: string) => clubStatusLabels[value] ?? fallbackLabel(value);
export const esPaymentMethod = (value: string) => paymentMethodLabels[value] ?? fallbackLabel(value);
export const esAuditAction = (value: string) => auditActionLabels[value] ?? fallbackLabel(value);
export const esVenueType = (value: string) => venueTypeLabels[value] ?? fallbackLabel(value);
export const esLayout = (value: string) => layoutLabels[value] ?? fallbackLabel(value);
