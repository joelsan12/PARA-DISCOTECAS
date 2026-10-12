import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import { callFunctions } from './functionsClient.ts';

export const CLIENT_VERSION = '1.0.0-beta';
export const ALLOWED_FEEDBACK_CATEGORIES = ['suggestion', 'bug', 'reservation', 'design'] as const;
export type FeedbackCategory = (typeof ALLOWED_FEEDBACK_CATEGORIES)[number];

export interface BetaFeedbackContext {
  path: string;
  userAgent: string;
  screen: string;
  portal: 'client' | 'saas';
}

export interface BetaFeedbackInput {
  rating: number;
  category: FeedbackCategory | string;
  message: string;
  contact?: string;
  portal?: 'client' | 'saas';
}

export interface SanitizedBetaFeedback {
  rating: number;
  category: FeedbackCategory;
  message: string;
  contact: string;
  context: BetaFeedbackContext;
  clientVersion: string;
}

export interface BetaLeadInput {
  clubName: string;
  city: string;
  whatsapp: string;
  plan?: string;
  source?: string;
}

export interface SanitizedBetaLead {
  clubName: string;
  city: string;
  whatsapp: string;
  plan: string;
  source: string;
  clientVersion: string;
}

export function buildFeedbackContext(portal: 'client' | 'saas' = 'client'): BetaFeedbackContext {
  const path = typeof window !== 'undefined' && window.location?.pathname
    ? window.location.pathname.slice(0, 120)
    : '/';
  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent
    ? navigator.userAgent.slice(0, 200)
    : 'unknown';
  const screen = typeof window !== 'undefined' && window.innerWidth && window.innerHeight
    ? `${window.innerWidth}x${window.innerHeight}`
    : 'unknown';

  return {
    path,
    userAgent,
    screen,
    portal: portal === 'saas' ? 'saas' : 'client'
  };
}

export function sanitizeFeedback(
  input: BetaFeedbackInput,
  customContext?: BetaFeedbackContext
): SanitizedBetaFeedback {
  if (!input || typeof input !== 'object') {
    throw new Error('Payload de feedback inválido');
  }

  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('La calificación debe ser un número entero entre 1 y 5');
  }

  const category = String(input.category || '').trim() as FeedbackCategory;
  if (!ALLOWED_FEEDBACK_CATEGORIES.includes(category)) {
    throw new Error(`Categoría inválida: ${category}. Permitidas: ${ALLOWED_FEEDBACK_CATEGORIES.join(', ')}`);
  }

  const message = String(input.message || '').trim();
  if (!message || message.length > 1000) {
    throw new Error('El mensaje no puede estar vacío ni superar los 1000 caracteres');
  }

  const contact = String(input.contact || '').trim();
  if (contact.length > 60) {
    throw new Error('El contacto no puede superar los 60 caracteres');
  }

  const context = customContext ?? buildFeedbackContext(input.portal);

  return {
    rating,
    category,
    message,
    contact,
    context,
    clientVersion: CLIENT_VERSION
  };
}

export function sanitizeLead(input: BetaLeadInput): SanitizedBetaLead {
  if (!input || typeof input !== 'object') {
    throw new Error('Payload de lead inválido');
  }

  const clubName = String(input.clubName || '').trim();
  if (!clubName || clubName.length > 80) {
    throw new Error('El nombre del club debe tener entre 1 y 80 caracteres');
  }

  const city = String(input.city || '').trim();
  if (!city || city.length > 80) {
    throw new Error('La ciudad debe tener entre 1 y 80 caracteres');
  }

  const whatsapp = String(input.whatsapp || '').trim();
  if (!whatsapp || whatsapp.length > 25) {
    throw new Error('El número de WhatsApp debe tener entre 1 y 25 caracteres');
  }

  const plan = String(input.plan || 'Club Pro').trim();
  if (!plan || plan.length > 40) {
    throw new Error('El plan debe tener entre 1 y 40 caracteres');
  }

  const sourceRaw = String(
    input.source || (typeof window !== 'undefined' ? window.location.pathname : '/software')
  ).trim();
  const source = (sourceRaw || '/software').slice(0, 120);

  return {
    clubName,
    city,
    whatsapp,
    plan,
    source,
    clientVersion: CLIENT_VERSION
  };
}

export async function submitBetaFeedback(input: BetaFeedbackInput): Promise<{ id: string }> {
  const sanitized = sanitizeFeedback(input);

  // 1. Intentar vía endpoint HTTP en backend (registra en DB y despacha correo a contacto@j2sdynamics.com)
  const backendUrl = typeof window !== 'undefined' && (import.meta.env.VITE_BACKEND_URL as string | undefined);
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/v1/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitized)
      });

      if (response.ok) {
        const data = await response.json() as { id: string };
        return { id: data.id };
      }
    } catch (err) {
      console.warn('⚠️ [BetaIntake] HTTP /v1/feedback/submit no disponible, probando callable:', err);
    }
  }

  // 2. Intentar vía callable de Firebase Functions
  try {
    const result = await callFunctions<{ id: string }>('submitBetaFeedback', sanitized);
    if (result?.id) {
      return { id: result.id };
    }
  } catch (callableError) {
    console.warn('⚠️ [BetaIntake] Callable submitBetaFeedback no disponible, fallback directo a Firestore:', callableError);
  }

  // 3. Fallback directo a Firestore cliente (garantía fail-closed contra pérdida de feedback)
  if (!isFirebaseConfigured || !db) {
    throw new Error('El servicio de base de datos no está disponible actualmente');
  }

  const docRef = await addDoc(collection(db, 'betaFeedback'), {
    ...sanitized,
    createdAt: serverTimestamp()
  });

  return { id: docRef.id };
}

export async function submitBetaLead(input: BetaLeadInput): Promise<{ id: string }> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('El servicio de base de datos no está disponible actualmente');
  }

  const sanitized = sanitizeLead(input);
  const docRef = await addDoc(collection(db, 'betaLeads'), {
    ...sanitized,
    createdAt: serverTimestamp()
  });

  return { id: docRef.id };
}

export interface RegisterBetaClubOnlineInput {
  clubName: string;
  city: string;
  ownerName: string;
  email: string;
  whatsapp: string;
  plan?: string;
  source?: string;
}

export interface VisualGuideItem {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
}

export const OFFICIAL_VISUAL_GUIDES: VisualGuideItem[] = [
  {
    id: 'floor-plan',
    title: 'Diseñador de Plano',
    description: 'Cómo crear y organizar el mapa de tus mesas, palcos y barras en 5 minutos.',
    pdfUrl: '/guias/Guia_Visual_Crear_Plano_Para_Clubes.pdf'
  },
  {
    id: 'floor-ops',
    title: 'Sala en Vivo & Concierge',
    description: 'Control de mesas, semáforo de colores en vivo y atención de pedidos VIP.',
    pdfUrl: '/guias/Guia_Visual_Sala_Concierge_Dueno.pdf'
  },
  {
    id: 'events',
    title: 'Cartelera de Eventos',
    description: 'Cómo publicar fiestas temáticas, fijar horarios de cover y vender entradas anticipadas.',
    pdfUrl: '/guias/Guia_Visual_Eventos_Dueno.pdf'
  },
  {
    id: 'reservations',
    title: 'Control de Reservas & Entrada',
    description: 'Búsqueda rápida por nombre o celular en puerta y verificación de anticipos pagados.',
    pdfUrl: '/guias/Guia_Visual_Reservas_Dueno.pdf'
  },
  {
    id: 'staff',
    title: 'Personal, Meseros & Roles',
    description: 'Cómo dar accesos individuales a tu equipo y asignar zonas de mesas para evitar cruces.',
    pdfUrl: '/guias/Guia_Visual_Personal_Staff_Dueno.pdf'
  }
];

export interface RegisterBetaClubOnlineResponse {
  success: boolean;
  businessId: string;
  clubName: string;
  city: string;
  slug: string;
  credentials: {
    email: string;
    temporaryPassword: string;
    adminUrl: string;
    brandUrl: string;
  };
  guides?: VisualGuideItem[];
  emailSent: boolean;
  message: string;
}

export async function registerBetaClubOnline(
  input: RegisterBetaClubOnlineInput
): Promise<RegisterBetaClubOnlineResponse> {
  const clubName = input.clubName.trim();
  const city = input.city.trim();
  const ownerName = input.ownerName.trim();
  const email = input.email.trim().toLowerCase();
  const whatsapp = input.whatsapp.trim();
  const plan = (input.plan || 'Club Pro').trim();
  const source = input.source || (typeof window !== 'undefined' ? window.location.pathname : '/software');

  if (!clubName || !city || !ownerName || !email || !whatsapp) {
    throw new Error('Por favor completa todos los campos requeridos.');
  }

  const payload = {
    clubName,
    city,
    ownerName,
    email,
    whatsapp,
    plan,
    source
  };

  // 1. Intentar vía endpoint HTTP en Backend Render
  const backendUrl = typeof window !== 'undefined' && (import.meta.env.VITE_BACKEND_URL as string | undefined);
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/+$/, '')}/v1/beta/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json() as RegisterBetaClubOnlineResponse;
        return data;
      }
      const errorJson = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (errorJson?.error?.message) {
        throw new Error(errorJson.error.message);
      }
    } catch (err) {
      console.warn('⚠️ [BetaIntake] HTTP directo falló o tuvo error, intentando callable:', err);
      if (err instanceof Error && err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }
  }

  // 2. Fallback vía callable de Firebase Functions
  try {
    const result = await callFunctions<RegisterBetaClubOnlineResponse>('registerBetaClub', payload);
    return result;
  } catch (callableError) {
    console.error('❌ [BetaIntake] Callable falló:', callableError);
    // Registrar el lead en betaLeads de Firestore para que no se pierda el prospecto
    try {
      await submitBetaLead({
        clubName,
        city,
        whatsapp,
        plan,
        source
      });
    } catch {
      // Ignorar error secundario de persistencia
    }
    throw new Error(
      callableError instanceof Error
        ? callableError.message
        : 'No se pudo activar automáticamente el club en este momento. Puedes contactarnos directamente por WhatsApp.'
    );
  }
}
