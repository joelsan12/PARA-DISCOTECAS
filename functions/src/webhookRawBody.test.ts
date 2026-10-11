import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";
import express from "express";
import type { Request, Response } from "express";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const { rawBody } = await import("./http.js");

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

describe("raw body byte-exacto del webhook de pagos", () => {
  it("devuelve exactamente los bytes originales cuando body es un Buffer (camino Express)", () => {
    const payload = Buffer.from('{"id":"evt_1","status":"succeeded","amount": 150.00,"note":"ñ á"}', "utf8");
    const request = { body: payload } as unknown as FirebaseRequest;
    const recovered = rawBody(request);
    assert.ok(recovered.equals(payload), "los bytes devueltos deben coincidir byte a byte con los recibidos");
    assert.equal(sha256(recovered), sha256(payload));
  });

  it("prefiere request.rawBody del proveedor (camino Cloud Functions)", () => {
    const payload = Buffer.from('{"id":"evt_2"}', "utf8");
    const request = { rawBody: payload, body: {} } as unknown as FirebaseRequest;
    assert.ok(rawBody(request).equals(payload));
  });

  it("sin rawBody no inventa bytes: devuelve vacio (fail-closed) en lugar de JSON.stringify", () => {
    // Regresión: re-serializar un objeto con JSON.stringify produce bytes
    // distintos a los firmados por el PSP y la verificación HMAC falla siempre.
    const request = { body: { id: "evt_4", status: "succeeded" } } as unknown as FirebaseRequest;
    assert.equal(rawBody(request).length, 0);
  });

  it("el middleware verify de server.ts preserva los bytes exactos sobre HTTP real", async () => {
    const app = express();
    app.use(express.json({
      limit: "1mb",
      verify: (request: Request, _response: Response, buffer: Buffer) => {
        (request as unknown as { rawBody?: Buffer }).rawBody = buffer;
      }
    }));
    app.post("/payments/webhook", (request: Request, response: Response) => {
      const raw = rawBody(request as unknown as FirebaseRequest);
      response.json({ sha256: sha256(raw), length: raw.length });
    });
    app.post("/v1/call/ping", (request: Request, response: Response) => {
      response.json({ got: (request.body as { name?: string }).name ?? null });
    });

    const server = app.listen(0);
    try {
      const port = (server.address() as AddressInfo).port;
      const payload = '{"id":"evt_exact","status":"succeeded","note":"ñ á \\"comillas\\"","amount":150}';
      const response = await fetch(`http://127.0.0.1:${port}/payments/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: payload
      });
      const data = await response.json() as { sha256: string; length: number };
      assert.equal(data.length, Buffer.byteLength(payload, "utf8"));
      assert.equal(data.sha256, sha256(Buffer.from(payload, "utf8")));

      // El resto de endpoints JSON no se rompe con el hook verify.
      const callResponse = await fetch(`http://127.0.0.1:${port}/v1/call/ping`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "nightflow" })
      });
      const callData = await callResponse.json() as { got: string | null };
      assert.equal(callData.got, "nightflow");
    } finally {
      server.close();
    }
  });

  it("la ruta Express parametrizada /v1/payments/webhooks/:provider/:merchantId expone provider y merchantId", async () => {
    const app = express();
    app.use(express.json({
      limit: "1mb",
      verify: (request: Request, _response: Response, buffer: Buffer) => {
        (request as unknown as { rawBody?: Buffer }).rawBody = buffer;
      }
    }));
    app.post("/v1/payments/webhooks/:provider/:merchantId", (request: Request, response: Response) => {
      response.json({
        provider: request.params.provider,
        merchantId: request.params.merchantId
      });
    });

    const server = app.listen(0);
    try {
      const port = (server.address() as AddressInfo).port;
      const res = await fetch(`http://127.0.0.1:${port}/v1/payments/webhooks/kushki/merchant_test_123`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "test" })
      });
      const data = await res.json() as { provider: string; merchantId: string };
      assert.equal(data.provider, "kushki");
      assert.equal(data.merchantId, "merchant_test_123");
    } finally {
      server.close();
    }
  });
});

