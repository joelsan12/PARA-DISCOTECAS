import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { cert, getApps, initializeApp } from "firebase-admin/app";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const functionsRoot = path.resolve(scriptDirectory, "..");

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || key in process.env) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2)
      || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(functionsRoot, ".env"));
loadEnvFile(path.join(functionsRoot, ".env.local"));
loadEnvFile(path.join(functionsRoot, ".env.nightflow-vip"));

function initAdmin(): void {
  const serialized = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!serialized) {
    console.warn("⚠️ [Server] FIREBASE_SERVICE_ACCOUNT_JSON no definida — se usarán las credenciales por defecto del entorno (ADC o emuladores).");
    return;
  }
  if (getApps().length > 0) return;
  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const projectId = typeof parsed.project_id === "string" ? parsed.project_id : undefined;
    const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email : undefined;
    const privateKey = typeof parsed.private_key === "string" ? parsed.private_key : undefined;
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Faltan project_id, client_email o private_key");
    }
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    });
    console.info(`✅ [Server] Firebase Admin inicializado con FIREBASE_SERVICE_ACCOUNT_JSON (project: ${projectId})`);
  } catch (error) {
    console.error("❌ [Server] FIREBASE_SERVICE_ACCOUNT_JSON inválida:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const CALLABLE_NAMES = [
  "createBusinessTenant",
  "requestOtp",
  "verifyOtp",
  "createBusinessCustomerProfile",
  "createReservationHold",
  "releaseHold",
  "createPaymentSession",
  "createBusinessSession",
  "emergencyRevoke",
  "privacyDeletionRequest"
] as const;

const TICK_INTERVAL_MS = Math.max(2_000, Number(process.env.HOLD_TICK_INTERVAL_MS ?? 8_000) || 8_000);

async function main(): Promise<void> {
  initAdmin();

  const [fns, reservationsModule, configModule] = await Promise.all([
    import("./index.js"),
    import("./reservations.js"),
    import("./config.js")
  ]);
  const { db, runtimeConfig } = configModule;
  const { releaseHoldById } = reservationsModule;

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(express.json({ limit: "1mb" }));

  const callableHandlers = new Map<string, express.Handler>();
  for (const name of CALLABLE_NAMES) {
    const handler = fns[name];
    if (typeof handler === "function") {
      callableHandlers.set(name, handler as unknown as express.Handler);
    }
  }

  app.all("/v1/call/:name", (request: Request, response: Response, next: NextFunction) => {
    const rawName = request.params.name;
    const name = Array.isArray(rawName) ? rawName[0] ?? "" : rawName ?? "";
    const handler = callableHandlers.get(name);
    if (!handler) {
      response.status(404).json({ error: { status: "not-found", message: `Función desconocida: ${name}` } });
      return;
    }
    handler(request, response, next);
  });

  app.all("/otp/request", fns.requestOtpHttp as unknown as express.Handler);
  app.all("/otp/verify", fns.verifyOtpHttp as unknown as express.Handler);
  app.post("/payments/webhook", fns.paymentWebhook as unknown as express.Handler);

  const doorAppPath = process.env.DOOR_APP_PATH?.trim()
    || path.resolve(functionsRoot, "..", "services", "door-service", "dist", "app.js");
  let doorEnabled = false;
  if (existsSync(doorAppPath)) {
    try {
      const doorModule = await import(pathToFileURL(doorAppPath).href) as {
        createApp?: (dependencies?: Record<string, unknown>) => unknown;
      };
      if (typeof doorModule.createApp === "function") {
        app.use("/door", doorModule.createApp({}) as express.Router);
        doorEnabled = true;
        console.info("🚪 [Server] door-service montado en /door");
      } else {
        console.warn("⚠️ [Server] door-service no exporta createApp:", doorAppPath);
      }
    } catch (error) {
      console.error("⚠️ [Server] door-service no pudo montarse:", error instanceof Error ? error.message : error);
    }
  } else {
    console.warn("⚠️ [Server] dist de door-service no encontrado:", doorAppPath);
  }

  app.get("/health", (_request: Request, response: Response) => {
    response.json({
      ok: true,
      service: "nightflow-api",
      door: doorEnabled,
      project: runtimeConfig.projectId ?? null,
      appCheckEnforced: runtimeConfig.appCheckEnforced
    });
  });

  app.use((_request: Request, response: Response) => {
    response.status(404).json({ error: { status: "not-found", message: "Ruta no encontrada" } });
  });

  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    const status = typeof error === "object" && error !== null && typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
    const expose = status < 500;
    const message = expose && error instanceof Error ? error.message : "Error interno del servidor";
    response.status(status).json({ error: { status: status === 400 ? "invalid-argument" : "internal", message } });
  });

  let ticking = false;
  async function releaseExpiredHolds(): Promise<void> {
    if (ticking) return;
    ticking = true;
    try {
      const now = Date.now();
      const [heldSnapshot, pendingSnapshot] = await Promise.all([
        db.collection("holds").where("state", "==", "HELD").orderBy("expiresAt", "asc").limit(50).get(),
        db.collection("holds").where("state", "==", "PAYMENT_PENDING").orderBy("expiresAt", "asc").limit(50).get()
      ]);
      const docs = [...heldSnapshot.docs, ...pendingSnapshot.docs];
      let released = 0;
      for (const document of docs) {
        const raw = document.get("expiresAt") as { toMillis?: () => number } | string | undefined;
        const millis = typeof raw === "object" && raw !== null && typeof raw.toMillis === "function"
          ? raw.toMillis()
          : typeof raw === "string"
            ? Date.parse(raw)
            : Number.NaN;
        if (Number.isFinite(millis) && millis <= now) {
          const result = await releaseHoldById(document.id, undefined, true);
          if (result.released) released += 1;
        }
      }
      if (released > 0) {
        console.info(`⏳ [Ticker] Holds expirados liberados: ${released}`);
      }
    } catch (error) {
      console.error("❌ [Ticker] Error liberando holds:", error);
    } finally {
      ticking = false;
    }
  }

  const port = Number(process.env.PORT ?? 8080);
  const server = app.listen(port, () => {
    console.info(`🎧 [Server] Nightflow API + Puerta escuchando en el puerto ${port}`);
    console.info(`   región=${runtimeConfig.region} appCheckEnforced=${runtimeConfig.appCheckEnforced} door=${doorEnabled ? "sí" : "no"}`);
  });

  const ticker = setInterval(() => { void releaseExpiredHolds(); }, TICK_INTERVAL_MS);
  ticker.unref();
  const initialTick = setTimeout(() => { void releaseExpiredHolds(); }, 3_000);
  initialTick.unref();

  const shutdown = (signal: string): void => {
    console.info(`⏻ [Server] Recibido ${signal}, cerrando…`);
    clearInterval(ticker);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  console.error("❌ [Server] Fallo al iniciar:", error);
  process.exit(1);
});
