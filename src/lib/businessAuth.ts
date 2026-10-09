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

// AGENTS §10: Cero backdoors de login demo en producción.
// BUSINESS_DEMO_ENABLED, DEMO_OTP_CODE, DEMO_AUTH_STORAGE_KEY ELIMINADOS.
// El flujo OTP solo vía Cloud Functions reales; sin fallbacks locales.
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
  isDemo: false;
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
  transport?: BusinessOtpTransport;
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