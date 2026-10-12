export interface RegisterBetaClubInput {
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
    guides: VisualGuideItem[];
    emailSent: boolean;
    message: string;
}
export declare const OFFICIAL_VISUAL_GUIDES: VisualGuideItem[];
export declare const BETA_VIP_FEATURES: string[];
export declare function normalizePlanId(planInput?: string): string;
export declare function parseRegisterBetaInput(value: unknown): RegisterBetaClubInput;
export declare function registerAndActivateBetaClub(input: RegisterBetaClubInput): Promise<RegisterBetaClubResult>;
