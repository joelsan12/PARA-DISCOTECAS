import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  type Auth,
  type ConfirmationResult,
  type User
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import {
  callFunctionWithHttpFallback,
  FunctionsClientError,
  isFunctionsClientAvailable
} from './functionsClient';
import { normalizeEcuadorPhone } from './formatEcuador';
import type { CustomerAuthMethod, OtpChallengeRequest, OtpChallengeResponse } from '../types/saas';

export const BUSINESS_DEMO_ENABLED = import.meta.env.DEV;
export const DEMO_AUTH_STORAGE_KEY = 'nightflow.saas.demo.auth.v1';
export const DEMO_OTP_CODE = '123456';
const RECAPTCHA_CONTAINER_ID = 'nightflow-business-auth-recaptcha';
const EMAIL_CHALLENGE_STORAGE_KEY = 'nightflow.saas.email-otp-challenge.v1';

const OTP_FUNCTIONS_NOT_DEPLOYED_MESSAGE = 'El servicio de códigos de acceso (Cloud Functions) no está desplegado en producción. Contacta al administrador de Nightflow.';

export type BusinessOtpMethod = Exclude<CustomerAuthMethod, 'password'>;
export type BusinessAuthMode = 'login' | 'register';
export type BusinessOtpTransport = 'functions' | 'firebase';

const OTP_CHANNEL_BY_METHOD: Record<BusinessOtpMethod, OtpChallengeRequest['channel']> = {
  email_otp: 'email',
  whatsapp_otp: 'whatsapp',
  sms_otp: 'sms'
};

export interface BusinessAuthUser {
  uid: string;
  displayName?: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface BusinessAuthResult {
  user: BusinessAuthUser;
  method: CustomerAuthMethod;
  isDemo: boolean;
}

export interface StartBusinessOtpInput extends Omit<OtpChallengeRequest, 'channel'> {
  method: BusinessOtpMethod;
}

export interface CompleteBusinessOtpInput {
  businessId: string;
  challengeId: string;
  code: string;
  displayName?: string;
}

export interface BusinessOtpChallenge extends OtpChallengeResponse {
  method: BusinessOtpMethod;
  transport?: BusinessOtpTransport | 'demo';
  demoCode?: string;
}

interface PendingOtpChallenge {
  businessId: string;
  identifier: string;
  method: BusinessOtpMethod;
  challengeId: string;
  expiresAt: number;
  transport?: BusinessOtpTransport;
  confirmation?: ConfirmationResult;
  verifier?: RecaptchaVerifier;
}

interface StoredEmailChallenge {
  businessId: string;
  identifier: string;
  method: 'email_otp';
  challengeId: string;
  expiresAt: string;
  transport: BusinessOtpTransport;
}

interface FunctionsOtpChallengeResponse extends OtpChallengeResponse {
  channel?: OtpChallengeRequest['channel'];
}

interface FunctionsOtpVerifyResponse {
  verified?: boolean;
  businessId?: string;
  challengeId?: string;
  channel?: OtpChallengeRequest['channel'];
  uid?: string;
  customToken?: string;
}

export class BusinessAuthError extends Error {
  readonly code: string;

  constructor(message: string, code = 'business-auth/unknown') {
    super(message);
    this.name = 'BusinessAuthError';
    this.code = code;
  }
}

const pendingChallenges = new Map<string, PendingOtpChallenge>();

const authErrorMessages: Record<string, string> = {
  'auth/invalid-credential': 'Las credenciales no coinciden con una cuenta válida.',
  'auth/invalid-email': 'Ingresa un correo electrónico válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'Usa una contraseña de al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento para continuar.',
  'auth/network-request-failed': 'No pudimos conectar con Firebase. Revisa tu conexión.',
  'auth/invalid-phone-number': 'Ingresa un número de teléfono válido.',
  'auth/operation-not-allowed': 'Este método de acceso aún no está habilitado en Firebase.',
  'auth/captcha-check-failed': 'La verificación de seguridad expiró. Inténtalo nuevamente.'
};

const getErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object' || !('code' in error)) return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
};

const throwAuthError = (error: unknown, fallback: string): never => {
  if (error instanceof BusinessAuthError) throw error;
  const code = getErrorCode(error);
  throw new BusinessAuthError(authErrorMessages[code] ?? fallback, code || 'business-auth/unknown');
};

const createUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `nf-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const normalizeEmail = (identifier: string): string => identifier.trim().toLocaleLowerCase('es');

const normalizePhone = (identifier: string): string => {
  const trimmed = identifier.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('593')) return `+${digits}`;
  if (digits.startsWith('0')) return normalizeEcuadorPhone(digits);
  if (digits.startsWith('9')) return `+593${digits}`;
  return `+${digits}`;
};

const validateEmail = (identifier: string): string => {
  const email = normalizeEmail(identifier);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BusinessAuthError('Ingresa un correo electrónico válido.', 'business-auth/invalid-email');
  }
  return email;
};

const validatePhone = (identifier: string): string => {
  const phone = normalizePhone(identifier);
  if (phone.replace(/\D/g, '').length < 8) {
    throw new BusinessAuthError('Ingresa un número de teléfono válido.', 'business-auth/invalid-phone');
  }
  return phone;
};

const toBusinessAuthUser = (user: User): BusinessAuthUser => ({
  uid: user.uid,
  ...(user.displayName ? { displayName: user.displayName } : {}),
  ...(user.email ? { email: user.email } : {}),
  ...(user.phoneNumber ? { phone: user.phoneNumber } : {}),
  emailVerified: user.emailVerified,
  phoneVerified: Boolean(user.phoneNumber),
  createdAt: user.metadata.creationTime || new Date().toISOString()
});

const canUseLocalStorage = (): boolean => (
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const readStoredEmailChallenge = (): StoredEmailChallenge | null => {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(EMAIL_CHALLENGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.businessId !== 'string' || typeof record.identifier !== 'string') return null;
    if (record.method !== 'email_otp' || typeof record.challengeId !== 'string' || typeof record.expiresAt !== 'string') return null;
    if (!Number.isFinite(Date.parse(record.expiresAt))) return null;
    const transport: BusinessOtpTransport = record.transport === 'functions' ? 'functions' : 'firebase';
    return {
      businessId: record.businessId,
      identifier: record.identifier,
      method: 'email_otp',
      challengeId: record.challengeId,
      expiresAt: record.expiresAt,
      transport
    };
  } catch {
    return null;
  }
};

const writeStoredEmailChallenge = (challenge: StoredEmailChallenge): void => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(EMAIL_CHALLENGE_STORAGE_KEY, JSON.stringify(challenge));
  } catch {
    return;
  }
};

const clearStoredEmailChallenge = (): void => {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(EMAIL_CHALLENGE_STORAGE_KEY);
  } catch {
    return;
  }
};

const normalizeOtpChallengeResponse = (value: unknown): FunctionsOtpChallengeResponse => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BusinessAuthError('El servidor de acceso no respondió correctamente.', 'business-auth/invalid-response');
  }
  const record = value as Record<string, unknown>;
  if (typeof record.challengeId !== 'string' || !record.challengeId.trim()) {
    throw new BusinessAuthError('El servidor de acceso no generó una verificación válida.', 'business-auth/invalid-response');
  }
  const expiresAtRaw = typeof record.expiresAt === 'string' ? record.expiresAt : '';
  const expiresAtMs = expiresAtRaw ? Date.parse(expiresAtRaw) : Number.NaN;
  const expiresAt = Number.isFinite(expiresAtMs)
    ? new Date(expiresAtMs).toISOString()
    : new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const retryAfterSeconds = typeof record.retryAfterSeconds === 'number' && record.retryAfterSeconds > 0
    ? Math.floor(record.retryAfterSeconds)
    : 60;
  const channel = record.channel === 'email' || record.channel === 'whatsapp' || record.channel === 'sms'
    ? record.channel
    : undefined;
  return {
    challengeId: record.challengeId.trim(),
    expiresAt,
    retryAfterSeconds,
    ...(channel ? { channel } : {})
  };
};

const parseDemoUser = (value: unknown): BusinessAuthUser | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.uid !== 'string' || !record.uid) return null;
  return {
    uid: record.uid,
    ...(typeof record.displayName === 'string' ? { displayName: record.displayName } : {}),
    ...(typeof record.email === 'string' ? { email: record.email } : {}),
    ...(typeof record.phone === 'string' ? { phone: record.phone } : {}),
    emailVerified: record.emailVerified === true,
    phoneVerified: record.phoneVerified === true,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString()
  };
};

const readDemoUser = (): BusinessAuthUser | null => {
  if (!BUSINESS_DEMO_ENABLED || !canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    return raw ? parseDemoUser(JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
};

const writeDemoUser = (user: BusinessAuthUser): void => {
  if (!BUSINESS_DEMO_ENABLED || !canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    return;
  }
};

const clearDemoUser = (): void => {
  if (!BUSINESS_DEMO_ENABLED || !canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  } catch {
    return;
  }
};

const createDemoUser = (
  identifier: string,
  method: CustomerAuthMethod,
  displayName?: string
): BusinessAuthUser => {
  const isEmail = method === 'password' || method === 'email_otp';
  const user: BusinessAuthUser = {
    uid: createUuid(),
    displayName: displayName?.trim() || (isEmail ? identifier.split('@')[0] : 'Invitado Nightflow'),
    ...(isEmail ? { email: identifier } : { phone: identifier }),
    emailVerified: isEmail,
    phoneVerified: !isEmail,
    createdAt: new Date().toISOString()
  };
  writeDemoUser(user);
  return user;
};

const getFirebaseAuth = (): Auth | null => {
  if (!isFirebaseConfigured) return null;
  if (!auth) {
    throw new BusinessAuthError(
      'Firebase está configurado, pero su servicio de autenticación no está disponible.',
      'business-auth/unavailable'
    );
  }
  return auth;
};

const resultFromUser = (
  user: User,
  method: CustomerAuthMethod,
  isDemo = false
): BusinessAuthResult => ({
  user: toBusinessAuthUser(user),
  method,
  isDemo
});

const resultFromBusinessUser = (user: BusinessAuthUser, method: CustomerAuthMethod): BusinessAuthResult => ({
  user,
  method,
  isDemo: true
});

const updateFirebaseDisplayName = async (user: User, displayName?: string): Promise<void> => {
  if (!displayName?.trim()) return;
  await updateProfile(user, { displayName: displayName.trim() });
};

const getEmailLinkUrl = (returnPath?: string): string => {
  if (typeof window === 'undefined') {
    throw new BusinessAuthError('El acceso por correo requiere un navegador.', 'business-auth/no-browser');
  }
  if (returnPath?.trim()) {
    const path = returnPath.trim();
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
      throw new BusinessAuthError('La ruta de retorno no es válida.', 'business-auth/invalid-return-path');
    }
    return new URL(path, window.location.origin).toString();
  }
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
};

const getRecaptchaContainerId = (): string => {
  if (typeof document === 'undefined') {
    throw new BusinessAuthError('La verificación de seguridad requiere un navegador.', 'business-auth/no-browser');
  }
  const existing = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (existing) return RECAPTCHA_CONTAINER_ID;
  const container = document.createElement('div');
  container.id = RECAPTCHA_CONTAINER_ID;
  document.body.appendChild(container);
  return RECAPTCHA_CONTAINER_ID;
};

const removePendingChallenge = (challengeId: string): void => {
  const challenge = pendingChallenges.get(challengeId);
  challenge?.verifier?.clear();
  pendingChallenges.delete(challengeId);
  const stored = readStoredEmailChallenge();
  if (!stored || stored.challengeId === challengeId) clearStoredEmailChallenge();
};

const getDemoOrFirebaseUser = (method: CustomerAuthMethod, identifier: string): BusinessAuthUser | null => {
  const existing = readDemoUser();
  if (!existing) return null;
  const matches = method === 'password' || method === 'email_otp'
    ? existing.email === identifier
    : existing.phone === identifier;
  return matches ? existing : null;
};

export function isBusinessAuthConfigured(): boolean {
  return isFirebaseConfigured && Boolean(auth);
}

export function getCurrentBusinessUser(): BusinessAuthUser | null {
  if (isFirebaseConfigured) {
    return auth?.currentUser ? toBusinessAuthUser(auth.currentUser) : null;
  }
  return readDemoUser();
}

export function subscribeToBusinessAuth(listener: (user: BusinessAuthUser | null) => void): () => void {
  const firebaseAuth = auth;
  if (isFirebaseConfigured && firebaseAuth) {
    return onAuthStateChanged(firebaseAuth, (user) => listener(user ? toBusinessAuthUser(user) : null));
  }
  if (!isFirebaseConfigured && BUSINESS_DEMO_ENABLED) {
    listener(readDemoUser());
  } else {
    listener(null);
  }
  return () => undefined;
}

export function getPendingBusinessOtp(businessId: string): BusinessOtpChallenge | null {
  if (!isFirebaseConfigured && !BUSINESS_DEMO_ENABLED) return null;
  const inMemory = [...pendingChallenges.values()].find((challenge) => (
    challenge.businessId === businessId && challenge.method === 'email_otp' && challenge.expiresAt > Date.now()
  ));
  if (inMemory) {
    return {
      challengeId: inMemory.challengeId,
      expiresAt: new Date(inMemory.expiresAt).toISOString(),
      retryAfterSeconds: 45,
      method: 'email_otp',
      ...(inMemory.transport ? { transport: inMemory.transport } : {})
    };
  }
  const stored = readStoredEmailChallenge();
  if (!stored || stored.businessId !== businessId || Date.parse(stored.expiresAt) <= Date.now()) {
    if (stored) clearStoredEmailChallenge();
    return null;
  }
  return {
    challengeId: stored.challengeId,
    expiresAt: stored.expiresAt,
    retryAfterSeconds: 45,
    method: 'email_otp',
    transport: stored.transport
  };
}

export async function signInBusinessCustomerWithPassword(
  email: string,
  password: string
): Promise<BusinessAuthResult> {
  const normalizedEmail = validateEmail(email);
  if (password.length < 6) {
    throw new BusinessAuthError('Usa una contraseña de al menos 6 caracteres.', 'business-auth/weak-password');
  }
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      return resultFromUser(credential.user, 'password');
    } catch (error) {
      throwAuthError(error, 'No pudimos iniciar sesión con Firebase.');
    }
  }
  if (!BUSINESS_DEMO_ENABLED) {
    throw new BusinessAuthError('La autenticación no está disponible en producción.', 'business-auth/unavailable');
  }
  const existing = getDemoOrFirebaseUser('password', normalizedEmail);
  return resultFromBusinessUser(existing ?? createDemoUser(normalizedEmail, 'password'), 'password');
}

export async function registerBusinessCustomerWithPassword(input: {
  displayName: string;
  email: string;
  password: string;
}): Promise<BusinessAuthResult> {
  const displayName = input.displayName.trim();
  const normalizedEmail = validateEmail(input.email);
  if (displayName.length < 2) {
    throw new BusinessAuthError('Ingresa tu nombre para completar el registro.', 'business-auth/display-name');
  }
  if (input.password.length < 6) {
    throw new BusinessAuthError('Usa una contraseña de al menos 6 caracteres.', 'business-auth/weak-password');
  }
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, input.password);
      await updateFirebaseDisplayName(credential.user, displayName);
      return resultFromUser(credential.user, 'password');
    } catch (error) {
      throwAuthError(error, 'No pudimos crear tu cuenta con Firebase.');
    }
  }
  if (!BUSINESS_DEMO_ENABLED) {
    throw new BusinessAuthError('La autenticación no está disponible en producción.', 'business-auth/unavailable');
  }
  return resultFromBusinessUser(createDemoUser(normalizedEmail, 'password', displayName), 'password');
}

const storeEmailChallenge = (
  businessId: string,
  identifier: string,
  challengeId: string,
  expiresAt: string,
  transport: BusinessOtpTransport
): void => {
  pendingChallenges.set(challengeId, {
    businessId,
    identifier,
    method: 'email_otp',
    challengeId,
    expiresAt: Date.parse(expiresAt),
    transport
  });
  writeStoredEmailChallenge({
    businessId,
    identifier,
    method: 'email_otp',
    challengeId,
    expiresAt,
    transport
  });
};

const requestOtpViaFunctions = async (
  input: StartBusinessOtpInput,
  identifier: string
): Promise<BusinessOtpChallenge | null> => {
  if (!isFunctionsClientAvailable()) return null;
  const method = input.method;
  try {
    const response = await callFunctionWithHttpFallback<FunctionsOtpChallengeResponse>(
      'requestOtp',
      'requestOtpHttp',
      {
        businessId: input.businessId,
        identifier,
        channel: OTP_CHANNEL_BY_METHOD[method],
        ...(input.returnPath ? { returnPath: input.returnPath } : {})
      }
    );
    const challenge = normalizeOtpChallengeResponse(response);
    if (method === 'email_otp') {
      storeEmailChallenge(input.businessId, identifier, challenge.challengeId, challenge.expiresAt, 'functions');
    } else {
      pendingChallenges.set(challenge.challengeId, {
        businessId: input.businessId,
        identifier,
        method,
        challengeId: challenge.challengeId,
        expiresAt: Date.parse(challenge.expiresAt),
        transport: 'functions'
      });
    }
    return {
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
      retryAfterSeconds: challenge.retryAfterSeconds,
      method,
      transport: 'functions'
    };
  } catch (error) {
    if (error instanceof FunctionsClientError && error.code === 'functions/not-deployed') {
      if (!import.meta.env.DEV) {
        throw new BusinessAuthError(OTP_FUNCTIONS_NOT_DEPLOYED_MESSAGE, 'business-auth/functions-not-deployed');
      }
      return null;
    }
    if (error instanceof FunctionsClientError) {
      throw new BusinessAuthError(error.message, `business-auth/${error.code}`);
    }
    if (error instanceof BusinessAuthError) throw error;
    const code = getErrorCode(error);
    throw new BusinessAuthError(authErrorMessages[code] ?? 'No pudimos enviar el código de acceso.', code || 'business-auth/unknown');
  }
};

export async function startBusinessOtp(input: StartBusinessOtpInput): Promise<BusinessOtpChallenge> {
  if (!input.businessId.trim()) {
    throw new BusinessAuthError('El negocio es obligatorio para continuar.', 'business-auth/business-required');
  }
  const method = input.method;
  const identifier = method === 'email_otp' ? validateEmail(input.identifier) : validatePhone(input.identifier);
  const challengeId = createUuid();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const viaFunctions = await requestOtpViaFunctions(input, identifier);
  if (viaFunctions) return viaFunctions;
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    if (!import.meta.env.DEV) {
      throw new BusinessAuthError(OTP_FUNCTIONS_NOT_DEPLOYED_MESSAGE, 'business-auth/functions-not-deployed');
    }
    if (method === 'email_otp') {
      try {
        await sendSignInLinkToEmail(firebaseAuth, identifier, {
          url: getEmailLinkUrl(input.returnPath),
          handleCodeInApp: true
        });
      } catch (error) {
        throwAuthError(error, 'No pudimos enviar el acceso por correo.');
      }
    } else {
      let verifier: RecaptchaVerifier | undefined;
      try {
        verifier = new RecaptchaVerifier(firebaseAuth, getRecaptchaContainerId(), { size: 'invisible' });
        const confirmation = await signInWithPhoneNumber(firebaseAuth, identifier, verifier);
        pendingChallenges.set(challengeId, {
          businessId: input.businessId,
          identifier,
          method,
          challengeId,
          expiresAt: Date.parse(expiresAt),
          confirmation,
          verifier,
          transport: 'firebase'
        });
      } catch (error) {
        verifier?.clear();
        throwAuthError(error, 'No pudimos enviar el código de acceso.');
      }
    }
    if (method === 'email_otp') {
      storeEmailChallenge(input.businessId, identifier, challengeId, expiresAt, 'firebase');
    }
    return { challengeId, expiresAt, retryAfterSeconds: 45, method, transport: 'firebase' };
  }
  if (!BUSINESS_DEMO_ENABLED) {
    throw new BusinessAuthError('La autenticación no está disponible en producción.', 'business-auth/unavailable');
  }
  pendingChallenges.set(challengeId, {
    businessId: input.businessId,
    identifier,
    method,
    challengeId,
    expiresAt: Date.parse(expiresAt)
  });
  if (method === 'email_otp') {
    writeStoredEmailChallenge({
      businessId: input.businessId,
      identifier,
      method: 'email_otp',
      challengeId,
      expiresAt,
      transport: 'firebase'
    });
  }
  return {
    challengeId,
    expiresAt,
    retryAfterSeconds: 45,
    method,
    transport: 'demo',
    demoCode: DEMO_OTP_CODE
  };
}

const verifyOtpViaFunctions = async (
  challenge: PendingOtpChallenge,
  input: CompleteBusinessOtpInput,
  code: string
): Promise<BusinessAuthResult | null> => {
  if (challenge.transport !== 'functions') return null;
  if (!isFunctionsClientAvailable()) {
    if (!import.meta.env.DEV) {
      throw new BusinessAuthError(OTP_FUNCTIONS_NOT_DEPLOYED_MESSAGE, 'business-auth/functions-not-deployed');
    }
    return null;
  }
  if (challenge.method === 'email_otp' && code === '000000') {
    throw new BusinessAuthError(
      'Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.',
      'business-auth/invalid-code'
    );
  }
  const displayName = input.displayName?.trim();
  let response: FunctionsOtpVerifyResponse;
  try {
    response = await callFunctionWithHttpFallback<FunctionsOtpVerifyResponse>(
      'verifyOtp',
      'verifyOtpHttp',
      {
        businessId: input.businessId,
        challengeId: input.challengeId,
        code,
        ...(displayName ? { displayName } : {})
      }
    );
  } catch (error) {
    if (error instanceof FunctionsClientError && error.code === 'functions/not-deployed') {
      if (!import.meta.env.DEV) {
        throw new BusinessAuthError(OTP_FUNCTIONS_NOT_DEPLOYED_MESSAGE, 'business-auth/functions-not-deployed');
      }
      return null;
    }
    if (error instanceof FunctionsClientError) {
      throw new BusinessAuthError(error.message, `business-auth/${error.code}`);
    }
    if (error instanceof BusinessAuthError) throw error;
    const code = getErrorCode(error);
    throw new BusinessAuthError(authErrorMessages[code] ?? 'No pudimos verificar el código de acceso.', code || 'business-auth/unknown');
  }
  const customToken = typeof response.customToken === 'string' ? response.customToken : '';
  if (!customToken) {
    throw new BusinessAuthError('La verificación no devolvió un token de acceso.', 'business-auth/missing-token');
  }
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new BusinessAuthError(
      'Firebase no está disponible para iniciar sesión con el token de acceso.',
      'business-auth/unavailable'
    );
  }
  try {
    const credential = await signInWithCustomToken(firebaseAuth, customToken);
    if (displayName && credential.user.displayName !== displayName) {
      await updateProfile(credential.user, { displayName });
    }
    removePendingChallenge(input.challengeId);
    return resultFromUser(credential.user, challenge.method);
  } catch (error) {
    if (error instanceof BusinessAuthError) throw error;
    const authCode = getErrorCode(error);
    throw new BusinessAuthError(authErrorMessages[authCode] ?? 'No pudimos iniciar sesión con el código verificado.', authCode || 'business-auth/unknown');
  }
};

export async function completeBusinessOtp(input: CompleteBusinessOtpInput): Promise<BusinessAuthResult> {
  const inMemoryChallenge = pendingChallenges.get(input.challengeId);
  const storedEmailChallenge = readStoredEmailChallenge();
  const restoredEmailChallenge: PendingOtpChallenge | undefined = storedEmailChallenge?.challengeId === input.challengeId
    ? {
      businessId: storedEmailChallenge.businessId,
      identifier: storedEmailChallenge.identifier,
      method: storedEmailChallenge.method,
      challengeId: storedEmailChallenge.challengeId,
      expiresAt: Date.parse(storedEmailChallenge.expiresAt),
      transport: storedEmailChallenge.transport
    }
    : undefined;
  const challenge = inMemoryChallenge ?? restoredEmailChallenge;
  if (!challenge) {
    throw new BusinessAuthError('Esta verificación expiró. Solicita un nuevo código.', 'business-auth/challenge-not-found');
  }
  if (challenge.businessId !== input.businessId) {
    throw new BusinessAuthError('La verificación no pertenece a este negocio.', 'business-auth/business-mismatch');
  }
  if (challenge.expiresAt <= Date.now()) {
    removePendingChallenge(input.challengeId);
    throw new BusinessAuthError('El código expiró. Solicita uno nuevo.', 'business-auth/challenge-expired');
  }
  const code = input.code.replace(/\s/g, '');
  const isFirebaseEmailLink = challenge.method === 'email_otp' && challenge.transport === 'firebase';
  if (!isFirebaseEmailLink && !/^\d{4,12}$/.test(code)) {
    throw new BusinessAuthError('Ingresa el código de 6 dígitos.', 'business-auth/invalid-code');
  }
  const viaFunctions = await verifyOtpViaFunctions(challenge, input, code);
  if (viaFunctions) return viaFunctions;
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    if (challenge.method === 'email_otp') {
      try {
        const linkUrl = typeof window === 'undefined' ? '' : window.location.href;
        if (!linkUrl || !isSignInWithEmailLink(firebaseAuth, linkUrl)) {
          throw new BusinessAuthError('Abre el enlace recibido por correo para continuar.', 'business-auth/email-link-required');
        }
        const credential = await signInWithEmailLink(firebaseAuth, challenge.identifier, linkUrl);
        await updateFirebaseDisplayName(credential.user, input.displayName);
        removePendingChallenge(input.challengeId);
        return resultFromUser(credential.user, challenge.method);
      } catch (error) {
        throwAuthError(error, 'No pudimos validar el acceso por correo.');
      }
    }
    if (!challenge.confirmation) {
      throw new BusinessAuthError('La verificación de teléfono no está disponible. Solicita un nuevo código.', 'business-auth/challenge-not-found');
    }
    try {
      const credential = await challenge.confirmation.confirm(code);
      await updateFirebaseDisplayName(credential.user, input.displayName);
      removePendingChallenge(input.challengeId);
      return resultFromUser(credential.user, challenge.method);
    } catch (error) {
      throwAuthError(error, 'El código no coincide. Revísalo e inténtalo nuevamente.');
    }
  }
  if (!BUSINESS_DEMO_ENABLED) {
    throw new BusinessAuthError('La autenticación no está disponible en producción.', 'business-auth/unavailable');
  }
  if (code !== DEMO_OTP_CODE) {
    throw new BusinessAuthError('El código demo no coincide. Usa 123456.', 'business-auth/invalid-demo-code');
  }
  const existing = getDemoOrFirebaseUser(challenge.method, challenge.identifier);
  const user = existing ?? createDemoUser(challenge.identifier, challenge.method, input.displayName);
  const updatedUser = input.displayName?.trim() ? { ...user, displayName: input.displayName.trim() } : user;
  writeDemoUser(updatedUser);
  removePendingChallenge(input.challengeId);
  return resultFromBusinessUser(updatedUser, challenge.method);
}

export async function signOutBusinessCustomer(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  clearStoredEmailChallenge();
  if (BUSINESS_DEMO_ENABLED) clearDemoUser();
}
