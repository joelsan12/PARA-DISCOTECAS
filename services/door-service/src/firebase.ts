import { existsSync } from 'node:fs'
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { ServiceUnavailableError } from './errors.js'

interface ServiceAccountDocument {
  project_id?: string
  client_email?: string
  private_key?: string
}

export class FirebaseRuntime {
  private readonly env: NodeJS.ProcessEnv
  private app: App | undefined
  private authClient: Auth | undefined
  private firestoreClient: Firestore | undefined
  private initializationError: Error | undefined

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.env = env
  }

  isConfigured(): boolean {
    if (this.env.FIRESTORE_EMULATOR_HOST || this.env.FIREBASE_AUTH_EMULATOR_HOST) return true
    if (this.env.DOOR_FIREBASE_SERVICE_ACCOUNT_JSON || this.env.DOOR_FIREBASE_SERVICE_ACCOUNT_BASE64 || this.env.FIREBASE_SERVICE_ACCOUNT_JSON || this.env.FIREBASE_SERVICE_ACCOUNT || this.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || this.env.FIREBASE_SERVICE_ACCOUNT_KEY || this.env.SERVICE_ACCOUNT_JSON) return true
    if (this.env.GOOGLE_APPLICATION_CREDENTIALS || this.env.FIREBASE_SERVICE_ACCOUNT_PATH) return true
    return Boolean(this.env.FIREBASE_PROJECT_ID || this.env.GOOGLE_CLOUD_PROJECT || this.env.GCLOUD_PROJECT || this.env.K_SERVICE)
  }

  isAuthConfigured(): boolean {
    return this.isConfigured() && !this.initializationError
  }

  isFirestoreConfigured(): boolean {
    return this.isConfigured() && !this.initializationError
  }

  getAuth(): Auth {
    this.ensureInitialized()
    if (!this.authClient) {
      throw new ServiceUnavailableError('Firebase Auth no está inicializado')
    }
    return this.authClient
  }

  getFirestore(): Firestore {
    this.ensureInitialized()
    if (!this.firestoreClient) {
      throw new ServiceUnavailableError('Firestore Admin no está inicializado')
    }
    return this.firestoreClient
  }

  private ensureInitialized(): void {
    if (this.app) return
    if (this.initializationError) {
      throw new ServiceUnavailableError('Firebase no está disponible')
    }
    if (!this.isConfigured()) {
      throw new ServiceUnavailableError('Firebase no está configurado')
    }

    try {
      const existing = getApps().find((candidate) => candidate.name === 'door-service')
      if (existing) {
        this.app = existing
      } else {
        this.app = this.createApp()
      }
      this.authClient = getAuth(this.app)
      this.firestoreClient = getFirestore(this.app)
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Firebase initialization failed')
      throw new ServiceUnavailableError('Firebase no está disponible')
    }
  }

  private createApp(): App {
    const serviceAccountValue = this.env.DOOR_FIREBASE_SERVICE_ACCOUNT_JSON ?? this.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? this.env.FIREBASE_SERVICE_ACCOUNT ?? this.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? this.env.SERVICE_ACCOUNT_JSON
    const serviceAccountBase64 = this.env.DOOR_FIREBASE_SERVICE_ACCOUNT_BASE64 ?? this.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    if (serviceAccountValue || serviceAccountBase64) {
      const serialized = serviceAccountValue ?? Buffer.from(serviceAccountBase64 ?? '', 'base64').toString('utf8')
      const serviceAccount = JSON.parse(serialized) as ServiceAccountDocument
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Invalid service account document')
      }
      return initializeApp({
        credential: cert({
          projectId: this.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key
        }),
        projectId: this.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id
      }, 'door-service')
    }

    const credentialsPath = this.env.GOOGLE_APPLICATION_CREDENTIALS ?? this.env.FIREBASE_SERVICE_ACCOUNT_PATH
    if (credentialsPath && existsSync(credentialsPath)) {
      return initializeApp({
        credential: applicationDefault(),
        projectId: this.env.FIREBASE_PROJECT_ID
      }, 'door-service')
    }

    if (this.env.FIRESTORE_EMULATOR_HOST || this.env.FIREBASE_AUTH_EMULATOR_HOST) {
      return initializeApp({
        projectId: this.env.FIREBASE_PROJECT_ID ?? 'door-service-local'
      }, 'door-service')
    }

    if (this.env.GOOGLE_CLOUD_PROJECT || this.env.GCLOUD_PROJECT || this.env.K_SERVICE) {
      return initializeApp({
        credential: applicationDefault(),
        projectId: this.env.FIREBASE_PROJECT_ID
      }, 'door-service')
    }

    throw new Error('Firebase credentials are not configured')
  }
}
