export interface RegisterBetaClubInput {
    clubName: string;
    city: string;
    ownerName: string;
    email: string;
    whatsapp: string;
    plan?: string;
    source?: string;
}
export interface RegisterBetaClubResult {
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
    emailSent: boolean;
    message: string;
}
export declare function parseRegisterBetaInput(value: unknown): RegisterBetaClubInput;
export declare function registerAndActivateBetaClub(input: RegisterBetaClubInput): Promise<RegisterBetaClubResult>;
