import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import {
  app,
  emulatorHost,
  firebaseConfig,
  functionsEmulatorPort,
  functionsRegion,
  getAppCheckToken,
  isAppCheckConfigured,
  isFirebaseConfigured,
  useEmulators,
  useFunctionsEmulator
} from './firebase';

export type FunctionsClientErrorCode = 'functions/not-deployed' | 'functions/unavailable' | 'functions/error';

export class FunctionsClientError extends Error {
  readonly code: FunctionsClientErrorCode;

  constructor(message: string, code: FunctionsClientErrorCode) {
    super(message);
    this.name = 'FunctionsClientError';
    this.code = code;
  }
}

let cachedFunctions: Functions | null = null;

export function isFunctionsClientAvailable(): boolean {
  return isFirebaseConfigured && Boolean(app);
}

function readErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object' || !('code' in error)) return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function isNotDeployedCode(code: string): boolean {
  return code === 'not-found'
    || code === 'unimplemented'
    || code === 'functions/not-found'
    || code === 'functions/unimplemented'
    || code === 'app/not-found'
    || code === 'unavailable'
    || code === 'functions/unavailable';
}

function toClientMessage(error: unknown, functionName: string): string {
  const code = readErrorCode(error);
  if (code === 'resource-exhausted') return 'Demasiadas solicitudes. Espera un momento e inténtalo nuevamente.';
  if (code === 'unauthenticated') return 'La verificación de seguridad falló. Revisa la configuración de App Check.';
  if (code === 'permission-denied') return 'No tienes permisos para esta operación.';
  if (code === 'failed-precondition') return 'El servicio no está listo para esta operación.';
  if (code === 'unavailable' || code === 'functions/unavailable') return 'El servicio de Nightflow no está disponible en este momento.';
  if (code === 'deadline-exceeded') return 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo nuevamente.';
  if (code === 'internal' || code === 'functions/internal') return 'El servicio no está disponible en este momento. Inténtalo nuevamente.';
  if (error instanceof Error && error.message) {
    const msg = error.message.trim();
    if (msg.toLowerCase().includes('internal') || msg.includes('[0]')) {
      return 'El servicio no está disponible temporalmente.';
    }
    return msg;
  }
  return `No pudimos completar la operación (${functionName}).`;
}

function getFunctionsClient(): Functions {
  if (!isFunctionsClientAvailable() || !app) {
    throw new FunctionsClientError('Firebase no está configurado para llamar a Cloud Functions.', 'functions/unavailable');
  }
  if (!cachedFunctions) {
    cachedFunctions = getFunctions(app, functionsRegion);
    if (useFunctionsEmulator) {
      connectFunctionsEmulator(cachedFunctions, emulatorHost, functionsEmulatorPort);
      console.info('🧪 [Functions] Conectado al emulador en', `${emulatorHost}:${functionsEmulatorPort}`);
    }
  }
  return cachedFunctions;
}

function assertAppCheckReady(functionName: string): void {
  if (!import.meta.env.PROD || useEmulators || !isFirebaseConfigured || isAppCheckConfigured) return;
  throw new FunctionsClientError(
    `${functionName} requiere App Check: define VITE_APPCHECK_SITE_KEY en el build de producción.`,
    'functions/unavailable'
  );
}

export async function callFunctions<T>(functionName: string, data: unknown): Promise<T> {
  assertAppCheckReady(functionName);
  const client = getFunctionsClient();
  try {
    const result = await httpsCallable<unknown, T>(client, functionName)(data);
    return result.data;
  } catch (error) {
    const code = readErrorCode(error);
    const message = error instanceof Error ? error.message : '';
    const isNetworkOrConnectionError =
      code === 'internal'
      || code === 'unavailable'
      || message.toLowerCase().includes('internal')
      || message.toLowerCase().includes('failed to fetch')
      || message.toLowerCase().includes('network');

    if (isNotDeployedCode(code)) {
      throw new FunctionsClientError(`La función ${functionName} no está desplegada.`, 'functions/not-deployed');
    }
    if (isNetworkOrConnectionError) {
      throw new FunctionsClientError(
        `El servicio de Nightflow (${functionName}) no está disponible en este momento.`,
        'functions/unavailable'
      );
    }
    throw new FunctionsClientError(toClientMessage(error, functionName), 'functions/error');
  }
}

function cloudFunctionsUrl(functionName: string): string {
  if (useFunctionsEmulator) {
    return `http://${emulatorHost}:${functionsEmulatorPort}/${firebaseConfig.projectId}/${functionsRegion}/${functionName}`;
  }
  return `https://${functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net/${functionName}`;
}

export async function callFunctionsHttp<T>(functionName: string, data: unknown): Promise<T> {
  assertAppCheckReady(functionName);
  if (!isFirebaseConfigured || !firebaseConfig.projectId) {
    throw new FunctionsClientError('Firebase no está configurado para llamar a Cloud Functions.', 'functions/unavailable');
  }
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const appCheckToken = await getAppCheckToken();
  if (appCheckToken) headers['x-firebase-appcheck'] = appCheckToken;
  let response: Response;
  try {
    response = await fetch(cloudFunctionsUrl(functionName), {
      method: 'POST',
      headers,
      body: JSON.stringify(data ?? {})
    });
  } catch {
    throw new FunctionsClientError('No pudimos conectar con Nightflow. Revisa tu conexión.', 'functions/unavailable');
  }
  if (response.status === 404 || response.status === 501) {
    throw new FunctionsClientError(`La función ${functionName} no está desplegada.`, 'functions/not-deployed');
  }
  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const record = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : null;
    const message = record && typeof record.message === 'string' && record.message
      ? record.message
      : `No pudimos completar la operación (${functionName}).`;
    const errorCode = record && typeof record.error === 'string' ? record.error : '';
    if (isNotDeployedCode(errorCode)) {
      throw new FunctionsClientError(`La función ${functionName} no está desplegada.`, 'functions/not-deployed');
    }
    throw new FunctionsClientError(message, 'functions/error');
  }
  return payload as T;
}

export async function callFunctionWithHttpFallback<T>(
  functionName: string,
  httpFunctionName: string,
  data: unknown
): Promise<T> {
  try {
    return await callFunctions<T>(functionName, data);
  } catch (error) {
    if (
      !(error instanceof FunctionsClientError) ||
      (error.code !== 'functions/not-deployed' && error.code !== 'functions/unavailable')
    ) {
      throw error;
    }
    return callFunctionsHttp<T>(httpFunctionName, data);
  }
}
