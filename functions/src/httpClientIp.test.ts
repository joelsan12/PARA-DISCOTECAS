import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request as FirebaseRequest } from "firebase-functions/v2/https";

process.env.GCLOUD_PROJECT ||= "demo-nightflow";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.TRUSTED_PROXY_CIDRS ||= "10.0.0.0/8,2001:db8::/32";

const { getClientIp } = await import("./http.js");

function fakeRequest(remoteAddress: string, forwardedFor?: string): FirebaseRequest {
  const headers: Record<string, string> = forwardedFor === undefined ? {} : { "x-forwarded-for": forwardedFor };
  return {
    headers,
    ip: remoteAddress,
    socket: { remoteAddress },
    get(header: string) {
      return headers[header.toLowerCase()];
    }
  } as unknown as FirebaseRequest;
}

describe("getClientIp con proxies confiables", () => {
  it("ignora x-forwarded-for cuando el par directo no es un proxy configurado", () => {
    const request = fakeRequest("203.0.113.9", "1.2.3.4");
    assert.equal(getClientIp(request), "203.0.113.9");
  });

  it("devuelve la primera direccion no confiable de la cadena", () => {
    const request = fakeRequest("10.0.0.5", "1.2.3.4, 198.51.100.7, 10.1.2.3");
    assert.equal(getClientIp(request), "198.51.100.7");
  });

  it("cae al par directo cuando toda la cadena son proxies", () => {
    const request = fakeRequest("10.0.0.5", "10.0.0.4, 10.0.0.3");
    assert.equal(getClientIp(request), "10.0.0.5");
  });

  it("resuelve IPv6 con prefijo", () => {
    const request = fakeRequest("10.0.0.5", "2001:db8::1, 2001:db9::2");
    assert.equal(getClientIp(request), "2001:db9::2");
  });

  it("no confunde familias de direcciones distintas", () => {
    const request = fakeRequest("10.0.0.5", "not-an-ip, 8.8.8.8");
    assert.equal(getClientIp(request), "8.8.8.8");
  });
});