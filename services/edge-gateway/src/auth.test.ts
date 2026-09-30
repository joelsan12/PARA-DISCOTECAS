import assert from "node:assert/strict";
import type { IncomingHttpHeaders } from "node:http";
import test from "node:test";
import { encodeProtocolPayload, readProtocolPayload, readSessionToken } from "./auth.js";

const protocolHeader = (value: string): IncomingHttpHeaders => ({ "sec-websocket-protocol": value });

test("E2: el payload de subprotocolo viaja en base64url sin credential en la query", () => {
  const encoded = encodeProtocolPayload({ businessId: "club-demo", deviceId: "door-1", token: "fb-token" });
  assert.ok(encoded.startsWith("nfa."));
  // Sin padding y sin caracteres fuera del alfabeto base64url.
  assert.ok(!encoded.includes("="));
  assert.ok(!encoded.includes("+"));
  assert.ok(!encoded.includes("/"));
  const decoded = readProtocolPayload(protocolHeader(`first-protocol, ${encoded}`));
  assert.deepEqual(decoded, { businessId: "club-demo", deviceId: "door-1", token: "fb-token" });
});

test("E2: subprotocolo ausente, malformado o no-objeto devuelve null", () => {
  assert.equal(readProtocolPayload({}), null);
  assert.equal(readProtocolPayload(protocolHeader("nfa.@@@no-base64@@@")), null);
  assert.equal(readProtocolPayload(protocolHeader(`nfa.${Buffer.from("[1,2]", "utf8").toString("base64url")}`)), null);
  assert.equal(readProtocolPayload(protocolHeader(`nfa.${Buffer.from('"texto"', "utf8").toString("base64url")}`)), null);
  // Un candidato corrupto no debe ocultar el válido de detrás.
  const valid = encodeProtocolPayload({ businessId: "ok" });
  assert.deepEqual(readProtocolPayload(protocolHeader(`nfa.%%%%, ${valid}`)), { businessId: "ok" });
});

test("E2: orden de resolución del token — cuerpo > Authorization > x-id-token > query", () => {
  const search = new URLSearchParams({ token: "query-token" });
  const headers: IncomingHttpHeaders = {
    authorization: "Bearer header-token",
    "x-id-token": "id-token"
  };
  const body = { token: "body-token" };
  assert.equal(readSessionToken(search, headers, body, false), "body-token");
  assert.equal(readSessionToken(search, headers, undefined, false), "header-token");
  assert.equal(readSessionToken(new URLSearchParams(), { "x-id-token": "id-token" }, undefined, false), "id-token");
  assert.equal(readSessionToken(search, {}, undefined, false), "");
  assert.equal(readSessionToken(search, {}, undefined, true), "query-token");
});

test("E2: un token vacío en el cuerpo no enmascara al de la query", () => {
  const search = new URLSearchParams({ token: "query-token" });
  assert.equal(readSessionToken(search, {}, { token: "   " }, true), "query-token");
  assert.equal(readSessionToken(search, {}, { token: "   " }, false), "");
});
