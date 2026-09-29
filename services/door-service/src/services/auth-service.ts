import { HttpError, ServiceUnavailableError, UnauthorizedError } from '../errors.js'
import { FirebaseRuntime } from '../firebase.js'
import type { AuthenticatedUser } from '../types.js'

export interface IdTokenVerifier {
  verifyIdToken(token: string): Promise<AuthenticatedUser>
}

export class FirebaseAuthService implements IdTokenVerifier {
  private readonly runtime: FirebaseRuntime

  constructor(runtime: FirebaseRuntime) {
    this.runtime = runtime
  }

  async verifyIdToken(token: string): Promise<AuthenticatedUser> {
    if (!this.runtime.isAuthConfigured()) {
      throw new ServiceUnavailableError('Firebase Auth no está configurado')
    }
    try {
      const decoded = await this.runtime.getAuth().verifyIdToken(token)
      return {
        uid: decoded.uid,
        claims: decoded as unknown as Record<string, unknown>
      }
    } catch (error) {
      if (error instanceof HttpError) throw error
      if (this.isDependencyFailure(error)) {
        throw new ServiceUnavailableError('Firebase Auth no está disponible')
      }
      throw new UnauthorizedError()
    }
  }

  private isDependencyFailure(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
    return ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'deadline-exceeded', 'unavailable', 'internal'].includes(code)
  }
}
