import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REENTRY_GRACE_MS,
  challengeForJws,
  isWithinReentryWindow,
  toBase64Url,
  fromBase64Url,
  verifyReentryProof
} from '../src/lib/reentryPasskey.ts';

describe('Frontend Reentry & Passkey Verification Suite (AGENTS §6.2)', () => {
  const sampleJws = 'eyJhbGciOiJFZERTQSIsImtpZCI6Im5pZ2h0Zmxvdy0yMDI2In0.eyJzdWIiOiJyZXNfc2FiYWRvX3ZpcF8wMDEiLCJqdGkiOiJ0b2tfMDAxIn0.valid_sig';
  const sampleOrigin = 'https://nightflow.vip';
  const sampleRp = 'nightflow.vip';

  it('debe definir la ventana de gracia de reingreso en exactamente 30 minutos (AGENTS §6.2)', () => {
    assert.strictEqual(REENTRY_GRACE_MS, 30 * 60 * 1000, 'REENTRY_GRACE_MS debe ser 30 minutos (1800000 ms)');
  });

  it('debe validar correctamente la ventana temporal de reingreso (isWithinReentryWindow)', () => {
    const now = Date.now();
    const futureWindow = now + 15 * 60 * 1000; // Le quedan 15 minutos
    const pastWindow = now - 5 * 1000; // Expiró hace 5 segundos

    assert.strictEqual(isWithinReentryWindow(futureWindow, now), true, 'Dentro de la ventana debe retornar true');
    assert.strictEqual(isWithinReentryWindow(pastWindow, now), false, 'Ventana vencida debe retornar false');
    assert.strictEqual(isWithinReentryWindow(now, now), false, 'En el límite exacto debe retornar false');
    assert.strictEqual(isWithinReentryWindow(undefined, now), false, 'Sin ventana definida debe retornar false');
  });

  it('debe calcular desafíos SHA-256 base64url deterministas y libres de colisión para el JWS', async () => {
    const challenge1 = await challengeForJws(sampleJws);
    const challenge2 = await challengeForJws(sampleJws);
    const differentJwsChallenge = await challengeForJws(sampleJws + '.different');

    assert.ok(typeof challenge1 === 'string' && challenge1.length > 0);
    assert.strictEqual(challenge1, challenge2, 'El mismo JWS debe generar idéntico desafío');
    assert.notStrictEqual(challenge1, differentJwsChallenge, 'Tokens distintos deben generar desafíos distintos');
    assert.ok(!challenge1.includes('='), 'El desafío base64url no debe contener padding =');
    assert.ok(!challenge1.includes('+') && !challenge1.includes('/'), 'Debe usar caracteres seguros para URL (- y _)');
  });

  it('debe codificar y decodificar base64url bidireccionalmente sin pérdida', () => {
    const originalBytes = new Uint8Array([0, 1, 2, 250, 255, 128, 64, 32, 16]);
    const encoded = toBase64Url(originalBytes);
    const decoded = fromBase64Url(encoded);

    assert.deepStrictEqual(decoded, originalBytes, 'Los bytes decodificados deben coincidir exactamente');
  });

  it('debe verificar exitosamente una prueba WebAuthn legítima firmada por el enclave de hardware (ES256)', async () => {
    // 1. Generar par de claves ECDSA P-256 (alg -7) simulando el hardware authenticator
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    const registration = {
      cid: 'cid_test_hardware_enclave_01',
      alg: -7,
      jwk: publicJwk,
      o: sampleOrigin,
      rp: sampleRp
    };

    // 2. Construir clientDataJSON conforme al desafío del JWS
    const expectedChallenge = await challengeForJws(sampleJws);
    const clientData = {
      type: 'webauthn.get',
      challenge: expectedChallenge,
      origin: sampleOrigin,
      crossOrigin: false
    };
    const clientDataBytes = new TextEncoder().encode(JSON.stringify(clientData));

    // 3. Construir authenticatorData: 32 bytes SHA-256(rp) + 1 byte flags (UP=1) + 4 bytes signCount
    const rpHolder = new TextEncoder().encode(sampleRp);
    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', rpHolder));
    const authData = new Uint8Array(37);
    authData.set(rpHash, 0);
    authData[32] = 0x01; // Flag: User Present (UP)

    // 4. Firmar con el enclave: authenticatorData || SHA-256(clientDataJSON)
    const clientDataHash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataBytes));
    const toSign = new Uint8Array(authData.length + 32);
    toSign.set(authData, 0);
    toSign.set(clientDataHash, authData.length);

    const rawSignature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.privateKey,
      toSign
    );

    const proof = {
      ad: toBase64Url(authData),
      cd: toBase64Url(clientDataBytes),
      sig: toBase64Url(rawSignature)
    };

    // 5. Validar que la prueba legítima es aprobada
    const isValid = await verifyReentryProof(sampleJws, proof, registration);
    assert.strictEqual(isValid, true, 'La prueba firmada con la passkey original debe ser válida');
  });

  it('debe rechazar pruebas firmadas por un dispositivo o passkey distinto (anti-transferencia)', async () => {
    // Clave registrada en primer ingreso
    const originalKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    const originalJwk = await crypto.subtle.exportKey('jwk', originalKeyPair.publicKey);
    const registration = {
      cid: 'cid_original_device',
      alg: -7,
      jwk: originalJwk,
      o: sampleOrigin,
      rp: sampleRp
    };

    // Segundo dispositivo con OTRA clave privada
    const attackerKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    const expectedChallenge = await challengeForJws(sampleJws);
    const clientData = {
      type: 'webauthn.get',
      challenge: expectedChallenge,
      origin: sampleOrigin,
      crossOrigin: false
    };
    const clientDataBytes = new TextEncoder().encode(JSON.stringify(clientData));

    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sampleRp)));
    const authData = new Uint8Array(37);
    authData.set(rpHash, 0);
    authData[32] = 0x01;

    const clientDataHash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataBytes));
    const toSign = new Uint8Array(authData.length + 32);
    toSign.set(authData, 0);
    toSign.set(clientDataHash, authData.length);

    // Firmado con la clave del atacante / segundo teléfono
    const attackerSignature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      attackerKeyPair.privateKey,
      toSign
    );

    const forgedProof = {
      ad: toBase64Url(authData),
      cd: toBase64Url(clientDataBytes),
      sig: toBase64Url(attackerSignature)
    };

    const isValid = await verifyReentryProof(sampleJws, forgedProof, registration);
    assert.strictEqual(isValid, false, 'Un segundo teléfono no puede reingresar con otra passkey');
  });

  it('debe rechazar capturas de pantalla / reenvíos con JWS adulterado o desafío no coincidente', async () => {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const registration = {
      cid: 'cid_test_screenshot',
      alg: -7,
      jwk: publicJwk,
      o: sampleOrigin,
      rp: sampleRp
    };

    // La prueba fue creada para el JWS_ORIGINAL
    const expectedChallenge = await challengeForJws(sampleJws);
    const clientData = {
      type: 'webauthn.get',
      challenge: expectedChallenge,
      origin: sampleOrigin,
      crossOrigin: false
    };
    const clientDataBytes = new TextEncoder().encode(JSON.stringify(clientData));

    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sampleRp)));
    const authData = new Uint8Array(37);
    authData.set(rpHash, 0);
    authData[32] = 0x01;

    const toSign = new Uint8Array(authData.length + 32);
    toSign.set(authData, 0);
    toSign.set(new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataBytes)), authData.length);

    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, toSign);

    const proof = {
      ad: toBase64Url(authData),
      cd: toBase64Url(clientDataBytes),
      sig: toBase64Url(signature)
    };

    // Alguien intenta reutilizar la prueba con OTRO token JWS rotado o de otra reserva
    const differentJws = sampleJws + '.screenshot.reenviado';
    const isDifferentJwsValid = await verifyReentryProof(differentJws, proof, registration);
    assert.strictEqual(isDifferentJwsValid, false, 'Prueba de reingreso vinculada a otro JWS debe fallar');
  });

  it('debe rechazar pruebas con origen cruzado o dominio no coincidente', async () => {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const registration = {
      cid: 'cid_origin_check',
      alg: -7,
      jwk: publicJwk,
      o: sampleOrigin,
      rp: sampleRp
    };

    // Origen atacante o crossOrigin = true
    const clientData = {
      type: 'webauthn.get',
      challenge: await challengeForJws(sampleJws),
      origin: 'https://phishing-club.com',
      crossOrigin: true
    };
    const clientDataBytes = new TextEncoder().encode(JSON.stringify(clientData));

    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sampleRp)));
    const authData = new Uint8Array(37);
    authData.set(rpHash, 0);
    authData[32] = 0x01;

    const toSign = new Uint8Array(authData.length + 32);
    toSign.set(authData, 0);
    toSign.set(new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataBytes)), authData.length);

    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, toSign);

    const proof = {
      ad: toBase64Url(authData),
      cd: toBase64Url(clientDataBytes),
      sig: toBase64Url(signature)
    };

    const isOriginValid = await verifyReentryProof(sampleJws, proof, registration);
    assert.strictEqual(isOriginValid, false, 'Origen no autorizado debe ser rechazado');
  });
});
