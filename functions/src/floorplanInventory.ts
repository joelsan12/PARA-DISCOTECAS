import type { CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./config.js";
import { AppError } from "./errors.js";
import { callableUid, isSuperAdmin, requireStaff } from "./auth.js";
import { writeAudit } from "./audit.js";
import { getClientIp, getRequestId } from "./http.js";
import { asRecord, assertAllowedKeys, requiredId } from "./validation.js";

export interface FloorPlanTableItem {
  id: string;
  tableCode: string;
  zone: string;
  capacity: number;
  minSpend: number;
  depositRequired: number;
  isActive: boolean;
}

export interface SyncFloorPlanInventoryInput {
  businessId: string;
  tables: FloorPlanTableItem[];
}

function parseTableItem(raw: unknown, index: number): FloorPlanTableItem {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new AppError("invalid-argument", `Table at index ${index} must be an object`);
  }
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === "string" ? item.id.trim() : "";
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) {
    throw new AppError("invalid-argument", `Table at index ${index} has an invalid or missing id`);
  }

  const rawCode = item.tableCode ?? item.table_code ?? item.name ?? id;
  const tableCode = typeof rawCode === "string" && rawCode.trim().length > 0 ? rawCode.trim().slice(0, 60) : id;

  const rawZone = item.zone ?? item.tier_name ?? "VIP";
  const zone = typeof rawZone === "string" && rawZone.trim().length > 0 ? rawZone.trim().slice(0, 60) : "VIP";

  const rawCapacity = item.capacity;
  const capacity = typeof rawCapacity === "number" && Number.isFinite(rawCapacity) && rawCapacity >= 1
    ? Math.min(Math.floor(rawCapacity), 100)
    : 4;

  const rawMinSpend = item.minSpend ?? item.min_spend ?? item.minSpendDefault ?? 0;
  const minSpend = typeof rawMinSpend === "number" && Number.isFinite(rawMinSpend) && rawMinSpend >= 0
    ? rawMinSpend
    : 0;

  const rawDeposit = item.depositRequired ?? item.deposit_required ?? 0;
  const depositRequired = typeof rawDeposit === "number" && Number.isFinite(rawDeposit) && rawDeposit >= 0
    ? rawDeposit
    : 0;

  const rawActive = item.isActive ?? item.is_active ?? item.active;
  const isActive = rawActive !== false;

  return {
    id,
    tableCode,
    zone,
    capacity,
    minSpend,
    depositRequired,
    isActive
  };
}

export function parseSyncInventoryInput(data: unknown): SyncFloorPlanInventoryInput {
  const record = asRecord(data);
  assertAllowedKeys(record, ["businessId", "tables"]);

  const businessId = requiredId(record, "businessId");
  const rawTables = record.tables;
  if (!Array.isArray(rawTables)) {
    throw new AppError("invalid-argument", "tables must be an array");
  }
  if (rawTables.length > 200) {
    throw new AppError("invalid-argument", "tables array exceeds the maximum limit of 200 items");
  }

  const tables = rawTables.map((t, idx) => parseTableItem(t, idx));
  return { businessId, tables };
}

export async function syncFloorPlanInventoryFor(
  request: CallableRequest<unknown>
): Promise<{
  success: boolean;
  businessId: string;
  syncedCount: number;
  deactivatedCount: number;
  skippedHoldsCount: number;
}> {
  const uid = callableUid(request);
  const input = parseSyncInventoryInput(request.data);

  const businessRef = db.collection("businesses").doc(input.businessId);
  const businessSnapshot = await businessRef.get();
  if (!businessSnapshot.exists) {
    throw new AppError("not-found", "Business not found", 404);
  }

  let actorRole = "super_admin";
  if (!(await isSuperAdmin(uid))) {
    const staff = await requireStaff(uid, input.businessId, "manager");
    actorRole = staff.role;
  }

  const resourcesCollection = businessRef.collection("resources");
  const existingSnapshot = await resourcesCollection.get();

  const existingMap = new Map<string, Record<string, unknown>>();
  for (const doc of existingSnapshot.docs) {
    existingMap.set(doc.id, doc.data());
  }

  const incomingIds = new Set<string>();
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();

  let syncedCount = 0;
  let skippedHoldsCount = 0;
  let deactivatedCount = 0;

  for (const table of input.tables) {
    incomingIds.add(table.id);
    const resourceRef = resourcesCollection.doc(table.id);
    const existing = existingMap.get(table.id);

    const hasActiveHold = Boolean(
      existing &&
      existing.activeHoldId &&
      typeof existing.activeHoldId === "string" &&
      (!existing.holdExpiresAt || (typeof existing.holdExpiresAt === "string" && new Date(existing.holdExpiresAt).getTime() > Date.now()))
    );

    if (hasActiveHold) {
      skippedHoldsCount++;
    }

    const resourceData: Record<string, unknown> = {
      businessId: input.businessId,
      resourceId: table.id,
      name: table.tableCode,
      label: table.tableCode,
      zone: table.zone,
      capacity: table.capacity,
      booking_mode: "table",
      source: "floorplan",
      is_active: table.isActive,
      active: table.isActive,
      currency: "USD",
      minSpendDefault: table.minSpend,
      depositRequired: table.depositRequired,
      updatedAt: now
    };

    // Si el recurso es nuevo o no tiene hold ni estado asignado, establecer AVAILABLE
    if (!existing || (!existing.status && !hasActiveHold)) {
      resourceData.status = "AVAILABLE";
      resourceData.activeHoldId = null;
      resourceData.holdTokenHash = null;
      resourceData.holdExpiresAt = null;
      resourceData.createdAt = now;
    }

    batch.set(resourceRef, resourceData, { merge: true });
    syncedCount++;
  }

  // Soft-delete de recursos originados por floorplan que ya no están en la lista actual
  for (const [existingId, existingData] of existingMap.entries()) {
    if (!incomingIds.has(existingId) && existingData.source === "floorplan") {
      const hasActiveHold = Boolean(
        existingData.activeHoldId &&
        typeof existingData.activeHoldId === "string" &&
        (!existingData.holdExpiresAt || (typeof existingData.holdExpiresAt === "string" && new Date(existingData.holdExpiresAt).getTime() > Date.now()))
      );

      if (hasActiveHold) {
        skippedHoldsCount++;
        continue;
      }

      if (existingData.is_active !== false || existingData.active !== false) {
        batch.set(resourcesCollection.doc(existingId), {
          is_active: false,
          active: false,
          updatedAt: now
        }, { merge: true });
        deactivatedCount++;
      }
    }
  }

  await batch.commit();

  await writeAudit(
    "floorplan.inventory_synced",
    "business",
    input.businessId,
    {
      businessId: input.businessId,
      actorUid: uid,
      actorRole,
      requestId: getRequestId(request.rawRequest),
      ip: getClientIp(request.rawRequest)
    },
    {
      syncedCount,
      deactivatedCount,
      skippedHoldsCount,
      totalSubmitted: input.tables.length
    }
  );

  return {
    success: true,
    businessId: input.businessId,
    syncedCount,
    deactivatedCount,
    skippedHoldsCount
  };
}
