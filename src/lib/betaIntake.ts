import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';

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
  if (!isFirebaseConfigured || !db) {
    throw new Error('El servicio de base de datos no está disponible actualmente');
  }

  const sanitized = sanitizeFeedback(input);
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
