import type { Club } from '../types';

/**
 * En producción y entorno real, los clubes se cargan exclusivamente desde
 * Cloud Firestore (businessDirectory y businesses). Lista vacía por defecto
 * para reflejar fielmente el estado real de la plataforma.
 */
export const INITIAL_CLUBS: Club[] = [];
