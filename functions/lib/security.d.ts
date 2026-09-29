import type { Request as FirebaseRequest, CallableRequest } from "firebase-functions/v2/https";
export declare function verifyAppCheckToken(token: string | undefined): Promise<boolean>;
export declare function assertHttpAppCheck(request: FirebaseRequest, required: boolean): Promise<void>;
export declare function assertCallableAppCheck(request: CallableRequest<unknown>): void;
export declare function assertCaptcha(token: string | undefined): Promise<void>;
