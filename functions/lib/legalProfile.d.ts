import type { CallableRequest } from "firebase-functions/v2/https";
/**
 * Identidad legal y fiscal del negocio (AGENTS.md Fase B).
 *
 * El checkout del cliente debe mostrar de forma transparente quién es el
 * vendedor real que cobra (razón social + RUC). Nightflow VIP es el proveedor
 * SaaS de la infraestructura, nunca el comerciante que percibe el dinero.
 *
 * Persistencia doble (misma transacción de lote):
 *  - businesses/{businessId}.legalProfile       → copia privada del tenant.
 *  - businesses/{businessId}/public/legalProfile → subdocumento legible por
 *    usuarios autenticados (reglas de firestore.rules bloquean toda escritura
 *    desde el cliente; solo este callable con Admin SDK puede escribirlo).
 */
export interface LegalProfileInput {
    businessId: string;
    legalName: string;
    ruc: string;
    taxAddress: string;
    supportEmail: string;
    supportPhone?: string;
    refundPolicyUrl?: string;
    termsAndConditionsUrl?: string;
}
/**
 * Valida la estructura matemática de un RUC ecuatoriano de 13 dígitos
 * (no consulta el SRI; solo el dígito verificador oficial):
 *  - Tercer dígito 0-5: persona natural, módulo 10, verificador en posición 10.
 *  - Tercer dígito 6: sociedad pública, módulo 11, verificador en posición 9.
 *  - Tercer dígito 9: sociedad privada / extranjero, módulo 11, verificador en posición 10.
 *  - Tercer dígito 7 u 8: códigos no asignados por el SRI.
 */
export declare function isValidEcuadorRuc(ruc: string): boolean;
export declare function parseLegalProfileInput(value: unknown): LegalProfileInput;
export declare function updateBusinessLegalProfileFor(request: CallableRequest<unknown>): Promise<Record<string, unknown>>;
