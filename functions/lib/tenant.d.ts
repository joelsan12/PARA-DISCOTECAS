interface CreateBusinessTenantInput {
    name: string;
    city: string;
    planId?: string;
    whatsappNumber?: string;
    businessType?: string;
    logoUrl?: string;
    coverUrl?: string;
    tagline?: string;
    primaryColor?: string;
    accentColor?: string;
    authMethods?: string[];
}
export declare function createBusinessTenant(input: CreateBusinessTenantInput & {
    uid: string;
}): Promise<{
    businessId: string;
    directoryId: string;
    resourceIds: string[];
}>;
export {};
