import { Timestamp } from "firebase-admin/firestore";
import { db } from "./config.js";
import { sha256 } from "./crypto.js";
import { AppError } from "./errors.js";
function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
async function verifySuperAdmin(uid) {
    const userSnapshot = await db.collection('users').doc(uid).get();
    if (!userSnapshot.exists) {
        throw new AppError('permission-denied', 'Usuario no encontrado', 403);
    }
    const userData = userSnapshot.data();
    if (userData?.superAdmin !== true) {
        throw new AppError('permission-denied', 'Se requiere privilegio de superadministrador', 403);
    }
}
export async function createBusinessTenant(input) {
    const uid = input.uid;
    await verifySuperAdmin(uid);
    const businessId = `club_${sha256(`${input.name}:${input.city}`).slice(0, 20)}`;
    const directoryId = businessId;
    const now = Timestamp.now();
    const authMethods = input.authMethods ?? ['password', 'email_otp', 'whatsapp_otp', 'sms_otp'];
    const batch = db.batch();
    // 1. Create businessDirectory document (strictly 9 allowed keys from firestore.rules)
    const directoryRef = db.collection('businessDirectory').doc(directoryId);
    batch.set(directoryRef, {
        name: input.name,
        slug: generateSlug(input.name),
        city: input.city,
        businessType: input.businessType ?? 'NIGHTCLUB',
        logoUrl: input.logoUrl ?? 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
        coverUrl: input.coverUrl ?? 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        verified: true,
        authMethods
    });
    // 2. Create businesses document
    const businessRef = db.collection('businesses').doc(businessId);
    batch.set(businessRef, {
        name: input.name,
        slug: generateSlug(input.name),
        city: input.city,
        businessType: input.businessType ?? 'NIGHTCLUB',
        logoUrl: input.logoUrl ?? 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80',
        coverUrl: input.coverUrl ?? 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
        status: 'active',
        verified: true,
        tagline: input.tagline ?? 'Experiencia nocturna de primer nivel',
        primaryColor: input.primaryColor ?? '#a855f7',
        accentColor: input.accentColor ?? '#06b6d4',
        authMethods,
        reentryMode: input.businessType === 'ROOFTOP' || input.businessType === 'EVENT_VENUE'
            ? 'physical_band'
            : 'digital_passkey',
        reentryMinutes: 30,
        customerCount: 0,
        createdAt: now,
        updatedAt: now
    });
    // 3. Create initial resources (tables)
    const defaultResources = [
        { resourceId: 'tbl_vip_01', status: 'AVAILABLE', active: true, holdAmount: 150 },
        { resourceId: 'tbl_vip_02', status: 'AVAILABLE', active: true, holdAmount: 150 },
        { resourceId: 'tbl_vip_03', status: 'AVAILABLE', active: true, holdAmount: 120 },
        { resourceId: 'tbl_standard_01', status: 'AVAILABLE', active: true, holdAmount: 80 },
        { resourceId: 'tbl_standard_02', status: 'AVAILABLE', active: true, holdAmount: 80 },
        { resourceId: 'tbl_standard_03', status: 'AVAILABLE', active: true, holdAmount: 80 },
    ];
    for (const resource of defaultResources) {
        const resourceRef = businessRef.collection('resources').doc(resource.resourceId);
        batch.set(resourceRef, {
            ...resource,
            eventId: null,
            holdTokenHash: null,
            holdExpiresAt: null,
            updatedAt: now
        });
    }
    await batch.commit();
    return {
        businessId,
        directoryId,
        resourceIds: defaultResources.map(r => r.resourceId)
    };
}
//# sourceMappingURL=tenant.js.map