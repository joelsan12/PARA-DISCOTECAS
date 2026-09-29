import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

globalThis.__NIGHTFLOW_ENV__ = { VITE_DOOR_SERVICE_URL: 'http://127.0.0.1:8080' };

const {
  ROTATION_SECONDS,
  TOKEN_TTL_SECONDS,
  encodePassPayload,
  decodePassPayload,
  buildDemoPassPayload,
  verifyTicketToken,
  benchmarkVerifyTicket,
  generatePassQr
} = await import('../src/lib/ticketPass.ts');

describe('Frontend Ticket Pass & Cryptography Suite (AGENTS §5)', () => {
  let edKeyPair;
  let publicJwk;
  const kid = 'nightflow-test-key-2026';
  const originalFetch = globalThis.fetch;

  before(async () => {
    // Generar par de claves Ed25519 (EdDSA) para simular el servicio de puerta Cloud Run
    edKeyPair = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
    publicJwk = await exportJWK(edKeyPair.publicKey);
    publicJwk.kid = kid;
    publicJwk.alg = 'EdDSA';

    // Mock global fetch para interceptar /v1/keys/:kid
    globalThis.fetch = async (url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/v1/keys/')) {
        return {
          ok: true,
          status: 200,
          json: async () => publicJwk
        };
      }
      return originalFetch(url, options);
    };
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  it('debe definir intervalos estrictos de rotación (30s) y TTL (45s) según AGENTS §5.3', () => {
    assert.strictEqual(ROTATION_SECONDS, 30, 'ROTATION_SECONDS debe ser exactamente 30');
    assert.strictEqual(TOKEN_TTL_SECONDS, 45, 'TOKEN_TTL_SECONDS debe ser exactamente 45');
  });

  it('debe serializar y decodificar correctamente los payloads del pase (JWS, demo, envelope)', () => {
    const fakeJws = 'eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJyZXNfMTIzIn0.signature_sample';

    // 1. Bare JWS
    const bareScan = decodePassPayload(fakeJws);
    assert.strictEqual(bareScan.kind, 'pass');
    assert.strictEqual(bareScan.jws, fakeJws);

    // 2. Structured Envelope (encodePassPayload)
    const envelope = encodePassPayload({
      jws: fakeJws,
      reg: { cid: 'cid_123', alg: -7, jwk: {}, o: 'https://nightflow.vip', rp: 'nightflow.vip' }
    });
    const decodedEnvelope = decodePassPayload(envelope);
    assert.strictEqual(decodedEnvelope.kind, 'pass');
    assert.strictEqual(decodedEnvelope.jws, fakeJws);
    assert.strictEqual(decodedEnvelope.reg?.cid, 'cid_123');

    // 3. Demo QR Payload
    const demoPayload = buildDemoPassPayload('RES-DEMO-999');
    const decodedDemo = decodePassPayload(demoPayload);
    assert.strictEqual(decodedDemo.kind, 'demo');
    assert.strictEqual(decodedDemo.body.rid, 'RES-DEMO-999');
    assert.strictEqual(decodedDemo.body.demo, true);

    // 4. Plain text / legacy code fallback
    const codeScan = decodePassPayload('INVALID_PLAIN_CODE');
    assert.strictEqual(codeScan.kind, 'code');
    assert.strictEqual(codeScan.text, 'INVALID_PLAIN_CODE');
  });

  it('debe verificar exitosamente un token JWS firmado con Ed25519', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      sub: 'res_vip_octava_001',
      jti: 'jti_unique_test_01',
      businessId: 'club_barahunda',
      eventId: 'evt_sabado_vip',
      venueId: 'venue_main',
      deviceId: 'dev_cust_mobile_01'
    })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('nightflow')
      .setAudience('nightflow-door')
      .setIssuedAt(now)
      .setExpirationTime(now + 45)
      .sign(edKeyPair.privateKey);

    const claims = await verifyTicketToken(token);
    assert.strictEqual(claims.sub, 'res_vip_octava_001');
    assert.strictEqual(claims.jti, 'jti_unique_test_01');
    assert.strictEqual(claims.businessId, 'club_barahunda');
    assert.strictEqual(claims.iss, 'nightflow');
    assert.strictEqual(claims.aud, 'nightflow-door');
  });

  it('debe tolerar clock-skew de hasta 30s pero rechazar tokens expirados más allá de la ventana', async () => {
    const now = Math.floor(Date.now() / 1000);

    // Token con expiración reciente (desfasado por 15 segundos en el pasado) - dentro de clockTolerance 30s
    const skewedToken = await new SignJWT({
      sub: 'res_skewed_ok',
      jti: 'jti_skew_01'
    })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('nightflow')
      .setAudience('nightflow-door')
      .setIssuedAt(now - 60)
      .setExpirationTime(now - 15)
      .sign(edKeyPair.privateKey);

    const claims = await verifyTicketToken(skewedToken);
    assert.strictEqual(claims.sub, 'res_skewed_ok');

    // Token con expiración en el pasado lejano (desfasado por 60 segundos) - excede clockTolerance
    const expiredToken = await new SignJWT({
      sub: 'res_expired_bad',
      jti: 'jti_skew_02'
    })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('nightflow')
      .setAudience('nightflow-door')
      .setIssuedAt(now - 120)
      .setExpirationTime(now - 60)
      .sign(edKeyPair.privateKey);

    await assert.rejects(
      async () => verifyTicketToken(expiredToken),
      /expired|claim/i,
      'Token expirado hace más de 30s debe ser rechazado'
    );
  });

  it('debe rechazar tokens con firma adulterada o emisor/audiencia inválidos', async () => {
    const now = Math.floor(Date.now() / 1000);

    // Token con emisor incorrecto
    const badIssuerToken = await new SignJWT({ sub: 'res_bad_iss' })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('malicious-issuer')
      .setAudience('nightflow-door')
      .setIssuedAt(now)
      .setExpirationTime(now + 45)
      .sign(edKeyPair.privateKey);

    await assert.rejects(
      async () => verifyTicketToken(badIssuerToken),
      /unexpected "iss" claim/i
    );

    // Token con firma rota (firma adulterada)
    const validToken = await new SignJWT({ sub: 'res_tampered' })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('nightflow')
      .setAudience('nightflow-door')
      .setIssuedAt(now)
      .setExpirationTime(now + 45)
      .sign(edKeyPair.privateKey);

    const parts = validToken.split('.');
    parts[2] = 'tampered_signature_bytes';
    const tamperedToken = parts.join('.');

    await assert.rejects(
      async () => verifyTicketToken(tamperedToken),
      /signature|verification failed/i
    );
  });

  it('debe ejecutar el benchmark de verificación en menos de 50 ms (AGENTS §5.1)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ sub: 'res_benchmark_pass' })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuer('nightflow')
      .setAudience('nightflow-door')
      .setIssuedAt(now)
      .setExpirationTime(now + 45)
      .sign(edKeyPair.privateKey);

    const result = await benchmarkVerifyTicket(token);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.kid, kid);
    assert.ok(result.durationMs < 50, `Verificación local debe tardar < 50 ms (obtenido: ${result.durationMs.toFixed(2)} ms)`);
  });

  it('debe generar el código QR en formato data URL PNG válido', async () => {
    const qrDataUrl = await generatePassQr('https://nightflow.vip/test-pass');
    assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'El QR generado debe ser un Data URL PNG');
    assert.ok(qrDataUrl.length > 100, 'El QR debe contener contenido de imagen válido');
  });
});
