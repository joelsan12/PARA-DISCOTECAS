import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  getToken,
  initializeAppCheck,
  type AppCheck
} from 'firebase/app-check';

const env: Record<string, string | undefined> = (typeof import.meta !== 'undefined' && import.meta.env)
  ? (import.meta.env as unknown as Record<string, string | undefined>)
  : {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const appCheckSiteKey = env.VITE_APPCHECK_SITE_KEY || '';
export const appCheckProviderName = (env.VITE_APPCHECK_PROVIDER || 'recaptcha_v3').toLowerCase();
export const appCheckDebugToken = env.DEV ? (env.VITE_APPCHECK_DEBUG_TOKEN || '') : '';
export const functionsRegion = (env.VITE_FUNCTIONS_REGION || 'us-central1').toLowerCase();

export const useEmulators = env.VITE_USE_EMULATORS === '1'
  || env.VITE_USE_EMULATORS === 'true'
  || Boolean(env.DEV);
export const useAuthEmulator = env.VITE_USE_AUTH_EMULATOR === '1'
  || env.VITE_USE_AUTH_EMULATOR === 'true'
  || Boolean(env.DEV);
export const useFunctionsEmulator = env.VITE_USE_FUNCTIONS_EMULATOR === '1'
  || env.VITE_USE_FUNCTIONS_EMULATOR === 'true'
  || Boolean(env.DEV);
export const emulatorHost = (env.VITE_EMULATOR_HOST || '127.0.0.1').split(':')[0] || '127.0.0.1';
export const functionsEmulatorPort = Number(env.VITE_FUNCTIONS_EMULATOR_PORT || 5001);

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'tu_api_key_aqui' &&
  !firebaseConfig.apiKey.includes('YOUR_')
);

export const isAppCheckConfigured = Boolean(isFirebaseConfigured && appCheckSiteKey);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let appCheck: AppCheck | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    if (useEmulators && db) {
      connectFirestoreEmulator(db, emulatorHost, 8080);
      if (auth && useAuthEmulator) {
        connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
        console.info('🧪 [Firebase] Conectado a Auth emulator en', `http://${emulatorHost}:9099`);
      }
      console.info('🧪 [Firebase] Conectado a emulador Firestore en', emulatorHost);
    } else {
      console.info('🔥 [Firebase] ¡Conectado con éxito al proyecto:', firebaseConfig.projectId);
    }
  } catch (err) {
    console.warn('[Firebase] Falló inicialización de Firebase:', err);
  }
} else if (env.DEV) {
  console.info('[Firebase] Modo Local / Memoria persistente activo. Para activar Firebase, define las variables VITE_FIREBASE_* en .env.local.');
}

if (app && isAppCheckConfigured) {
  try {
    const provider = appCheckProviderName === 'recaptcha_enterprise' || appCheckProviderName === 'recaptcha-enterprise'
      ? new ReCaptchaEnterpriseProvider(appCheckSiteKey)
      : new ReCaptchaV3Provider(appCheckSiteKey);
    appCheck = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
      ...(appCheckDebugToken ? { debugToken: appCheckDebugToken } : {})
    });
  } catch (err) {
    appCheck = null;
    if (env.DEV) console.warn('[Firebase] App Check no se pudo inicializar:', err);
  }
} else if (env.DEV && isFirebaseConfigured && !appCheckSiteKey) {
  console.info('[Firebase] App Check deshabilitado. Define VITE_APPCHECK_SITE_KEY para activarlo.');
}

if (env.PROD && isFirebaseConfigured && !useEmulators && !appCheckSiteKey) {
  console.error(
    '[Firebase] CRÍTICO: falta VITE_APPCHECK_SITE_KEY. Cloud Functions rechazará las llamadas en producción (App Check obligatorio).'
  );
}

export async function getAppCheckToken(): Promise<string | undefined> {
  if (!appCheck) return undefined;
  try {
    const result = await getToken(appCheck);
    return result.token ? result.token : undefined;
  } catch {
    return undefined;
  }
}

export { app, db, auth, appCheck };
