import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CloudOff,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  ScanLine,
  Siren,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { callFunctions, FunctionsClientError } from '../../lib/functionsClient';
import {
  ensureDoorDevice,
  getDoorSession,
  isWithinReentryWindow,
  nextDeviceSequence,
  REENTRY_GRACE_MS,
  saveDoorSession,
  signDevicePayload,
  type DoorDeviceInfo,
  type DoorPresenceState,
  type DoorDeviceSession
} from '../../lib/doorDevice';
import {
  benchmarkVerifyTicket,
  decodePassPayload,
  getDoorServiceUrl,
  isDoorServiceConfigured,
  preloadKnownDoorKeys,
  verifyTicketToken,
  type TicketClaims
} from '../../lib/ticketPass';
import {
  enqueueAttendance,
  flushAttendanceQueue,
  startQueueAutoFlush,
  subscribeQueue,
  type AttendanceAction,
  type AttendanceEventInput
} from '../../lib/doorOfflineQueue';
import {
  getDoorPasskey,
  isWithinReentryWindow as passkeyWindowOk,
  storeDoorPasskey,
  verifyReentryProof,
  type PasskeyRegistration,
  type ReentryProof
} from '../../lib/reentryPasskey';
import { EdgeGatewayClient, isEdgeGatewayConfigured, type EdgeConnectionState } from '../../lib/edgeGatewayClient';
import { isQrCameraSupported } from '../../lib/doorQrScanner';
import { QrCameraScanner } from './QrCameraScanner';
import '../../styles/doorTerminal.css';

const BUSINESS_STORAGE_KEY = 'nightflow.door.business.v1';

interface DoorPwaAppProps {
  demoReservations?: Array<{ code: string; customer_name: string; table_code: string }>;
}

interface DoorScanResult {
  tone: 'granted' | 'denied' | 'demo' | 'review';
  title: string;
  message: string;
  detail?: string;
  queued?: boolean;
  synced?: boolean;
  action?: AttendanceAction;
}

const conflictMessages: Record<string, string> = {
  ALREADY_INSIDE: 'El titular ya está dentro del establecimiento.',
  REENTRY_WINDOW_EXPIRED: 'Se superó la ventana de reingreso (30 minutos). Requiere autorización del administrador.',
  REENTRY_LIMIT_REACHED: 'Se alcanzó el límite de reingresos permitidos para esta entrada.',
  INVALID_REENTRY_STATE: 'No existe una salida temporal registrada para este pase.',
  OUT_OF_ORDER: 'Secuencia fuera de orden en esta terminal.',
  DEVICE_SEQUENCE_COLLISION: 'Colisión de secuencia detectada entre terminales. Revisión manual del personal; no se aplica ninguna sanción automática.',
  JTI_PAYLOAD_MISMATCH: 'Identificador de evento duplicado con contenido distinto. Revisión manual; sin cobro automático.',
  TICKET_REVOKED: 'El pase fue revocado.',
  TICKET_NOT_FOUND: 'El ticket no está registrado en Cloud Run.',
  EVENT_CANCELED: 'El evento fue cancelado.',
  EVENT_REVOKED: 'El evento fue revocado.',
  TOKEN_REVOKED: 'La versión del token está obsoleta.',
  VENUE_MISMATCH: 'El recinto del pase no coincide con este evento.',
  EVENT_MISMATCH: 'El evento del pase no coincide.',
  DEVICE_MISMATCH: 'El pase está vinculado a otro dispositivo.',
  DEVICE_NOT_ENROLLED: 'Esta terminal aún no está enrolada en Cloud Run.'
};

const readIdToken = async (): Promise<string | undefined> => {
  try {
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : undefined;
  } catch {
    return undefined;
  }
};

const lastBusinessId = (): string | undefined => {
  try {
    return window.localStorage.getItem(BUSINESS_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const rememberBusinessId = (businessId: string): void => {
  try {
    window.localStorage.setItem(BUSINESS_STORAGE_KEY, businessId);
  } catch {
    return;
  }
};

export const DoorPwaApp = ({ demoReservations = [] }: DoorPwaAppProps) => {
  const configured = isDoorServiceConfigured();
  const devMode = import.meta.env.DEV;
  const [scanInput, setScanInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DoorScanResult | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [device, setDevice] = useState<DoorDeviceInfo | null>(null);
  const [emergency, setEmergency] = useState<{ blocked: boolean; label: string; message: string }>({ blocked: false, label: 'SIN ALERTAS', message: 'Sin alertas de emergencia activas.' });
  const emergencyRef = useRef(emergency);
  const [pending, setPending] = useState<{ jws: string; claims: TicketClaims; session: DoorDeviceSession; proofNeeded: boolean } | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const enrolledRef = useRef(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [cameraEnabled, setCameraEnabled] = useState(() => isQrCameraSupported());
  const [edgeState, setEdgeState] = useState<EdgeConnectionState>(isEdgeGatewayConfigured() ? 'connecting' : 'disabled');
  const [edgeDetail, setEdgeDetail] = useState('');
  const [localVerifyMs, setLocalVerifyMs] = useState<number | null>(null);
  const [panicArmed, setPanicArmed] = useState(false);
  const [edgeBusinessId, setEdgeBusinessId] = useState<string | undefined>(() => lastBusinessId());
  const edgeClientRef = useRef<EdgeGatewayClient | null>(null);
  const panicConfirmRef = useRef<number | null>(null);

  useEffect(() => {
    if (!result) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (result.tone === 'granted') {
          navigator.vibrate([40, 50, 40]);
        } else {
          navigator.vibrate([160, 70, 160]);
        }
      } catch {
        // ignore
      }
    }
  }, [result]);

  const modeLabel = configured ? 'CLOUD RUN ACTIVO' : devMode ? 'DEMO LOCAL' : 'SERVICIO NO CONFIGURADO';
  const modeColor = configured ? '#34d399' : devMode ? '#fbbf24' : '#f43f5e';

  const applyLocalTransition = useCallback(async (
    ticketId: string,
    action: AttendanceAction,
    requestedState?: 'INSIDE' | 'OUTSIDE_TEMPORARY'
  ): Promise<DoorDeviceSession> => {
    const session = await getDoorSession(ticketId);
    const now = Date.now();
    if (action === 'EXIT') {
      return saveDoorSession({
        ...session,
        state: 'OUTSIDE_TEMPORARY',
        lastAction: 'EXIT',
        reentryExpiresAt: now + REENTRY_GRACE_MS
      });
    }
    if (action === 'CHECK_IN' || action === 'REENTRY' || (action === 'MANUAL_OVERRIDE' && requestedState === 'INSIDE')) {
      return saveDoorSession({
        ...session,
        state: 'INSIDE',
        reentryCount: action === 'REENTRY' || (action === 'MANUAL_OVERRIDE' && session.state === 'OUTSIDE_TEMPORARY')
          ? session.reentryCount + 1
          : session.reentryCount,
        reentryExpiresAt: undefined,
        lastAction: action
      });
    }
    if (action === 'MANUAL_OVERRIDE' && requestedState === 'OUTSIDE_TEMPORARY') {
      return saveDoorSession({
        ...session,
        state: 'OUTSIDE_TEMPORARY',
        lastAction: 'MANUAL_OVERRIDE',
        reentryExpiresAt: now + REENTRY_GRACE_MS
      });
    }
    return session;
  }, []);

  const dispatchAttendance = useCallback(async (
    claims: TicketClaims,
    action: AttendanceAction,
    options?: { requestedState?: 'INSIDE' | 'OUTSIDE_TEMPORARY' }
  ): Promise<DoorScanResult> => {
    const businessId = claims.businessId ?? '';
    const eventId = claims.eventId ?? '';
    const venueId = claims.venueId ?? '';
    const ticketId = claims.ticketId ?? claims.sub ?? '';
    const clientDeviceId = claims.deviceId ?? '';
    if (!businessId || !eventId || !venueId || !ticketId || !clientDeviceId) {
      return { tone: 'denied', title: 'PASE INCOMPLETO', message: 'El pase no incluye los identificadores exigidos por Cloud Run.' };
    }
    const doorDevice = await ensureDoorDevice();
    const deviceSequence = await nextDeviceSequence();
    const occurredAt = Date.now();
    const jti = crypto.randomUUID();
    const fields = {
      businessId,
      eventId,
      venueId,
      ticketId,
      deviceId: clientDeviceId,
      jti,
      deviceSequence,
      action,
      occurredAt,
      revocationVersion: typeof claims.revocationVersion === 'number' ? claims.revocationVersion : 0,
      ...(options?.requestedState ? { requestedState: options.requestedState } : {})
    };
    const signature = await signDevicePayload({ ...fields, iat: Math.floor(occurredAt / 1000) });
    const event: AttendanceEventInput = { ...fields, claims, signature };
    await enqueueAttendance(event);
    const session = await applyLocalTransition(ticketId, action, options?.requestedState);
    await saveDoorSession({ ...session, lastJti: jti });
    setPending({ jws: '', claims, session: { ...session, lastJti: jti }, proofNeeded: false });

    if (edgeClientRef.current) {
      void edgeClientRef.current.publishEvent({
        eventId: jti,
        deviceId: doorDevice.deviceId,
        deviceSequence,
        eventType: 'attendance',
        payload: { action, ticketId, venueId, occurredAt },
        signature
      });
    }

    const outcome = configured ? await flushAttendanceQueue().catch(() => null) : null;
    const serverResult = outcome?.results.find(item => item.jti === jti);
    if (serverResult) {
      const presence = (serverResult.presence ?? serverResult.state) as DoorPresenceState | undefined;
      if (presence) {
        const refreshed = await getDoorSession(ticketId);
        await saveDoorSession({
          ...refreshed,
          state: presence,
          ...(serverResult.reentryExpiresAt ? { reentryExpiresAt: Date.parse(serverResult.reentryExpiresAt) } : { reentryExpiresAt: presence === 'OUTSIDE_TEMPORARY' ? refreshed.reentryExpiresAt : undefined })
        });
      }
      if (serverResult.status === 'CONFLICT') {
        const message = conflictMessages[serverResult.reason ?? ''] ?? serverResult.reason ?? 'Conflicto reportado por Cloud Run.';
        return {
          tone: 'review',
          title: 'REVISIÓN MANUAL',
          message,
          detail: 'El evento quedó registrado para auditoría. No se aplica ningún cobro o sanción automática.',
          action
        };
      }
      if (serverResult.status === 'REJECTED') {
        const message = conflictMessages[serverResult.reason ?? ''] ?? serverResult.reason ?? 'Cloud Run rechazó el evento.';
        return { tone: 'denied', title: 'ACCESO RECHAZADO', message, action };
      }
    }

    const labels: Record<AttendanceAction, { tone: DoorScanResult['tone']; title: string; message: string }> = {
      CHECK_IN: { tone: 'granted', title: 'ACCESO AUTORIZADO', message: 'Ingreso registrado con firma de dispositivo y sincronizado.' },
      REENTRY: { tone: 'granted', title: 'REINGRESO AUTORIZADO', message: 'Passkey verificada dentro de la ventana de gracia de 30 minutos.' },
      EXIT: { tone: 'granted', title: 'SALIDA TEMPORAL', message: 'El pase queda fuera con ventana de reingreso de 30 minutos.' },
      MANUAL_OVERRIDE: { tone: 'review', title: 'AUTORIZACIÓN MANUAL', message: 'Ingreso permitido mediante revisión manual del portero.' }
    };
    const label = labels[action];
    const synced = Boolean(serverResult);
    return {
      ...label,
      detail: synced
        ? 'Confirmado por Cloud Run en este turno.'
        : `Sin red: evento cifrado en la cola offline de esta terminal (secuencia ${deviceSequence} del dispositivo ${doorDevice.deviceId.slice(0, 12)}…).`,
      queued: !synced,
      synced,
      action
    };
  }, [applyLocalTransition, configured]);

  const updateEmergency = useCallback((next: { blocked: boolean; label: string; message: string }) => {
    emergencyRef.current = next;
    setEmergency(next);
  }, []);

  const checkEmergency = useCallback(async (claims?: TicketClaims) => {
    if (!configured) {
      updateEmergency({ blocked: false, label: 'DEMO', message: 'Emergencias disponibles solo con Cloud Run conectado.' });
      return;
    }
    const businessId = claims?.businessId ?? lastBusinessId();
    if (!businessId) return;
    const idToken = await readIdToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const params = new URLSearchParams({ businessId });
      if (claims?.eventId) params.set('eventId', claims.eventId);
      if (claims?.deviceId) params.set('deviceId', claims.deviceId);
      const response = await fetch(`${getDoorServiceUrl()}/v1/emergency/status?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'X-Business-Id': businessId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        }
      });
      if (!response.ok) {
        updateEmergency({ blocked: false, label: 'SIN SEÑAL', message: 'No se pudo consultar el estado de emergencia.' });
        return;
      }
      const body = await response.json() as { blocked?: boolean; state?: string; reason?: string };
      const blocked = body.blocked === true;
      updateEmergency({
        blocked,
        label: blocked ? (body.state === 'CANCELED' ? 'EVENTO CANCELADO' : 'REVOCACIÓN ACTIVA') : 'OPERACIÓN NORMAL',
        message: blocked
          ? (body.reason ? `Motivo: ${body.reason}` : 'Acceso suspendido por la central de seguridad.')
          : 'Sin alertas de emergencia activas.'
      });
    } catch {
      updateEmergency({ blocked: false, label: 'SIN SEÑAL', message: 'Sin conexión con la central de emergencias.' });
    } finally {
      clearTimeout(timeout);
    }
  }, [configured, updateEmergency]);

  const enrollDevice = useCallback(async (businessId?: string) => {
    if (!configured || enrolledRef.current) return;
    const target = businessId ?? lastBusinessId();
    if (!target) return;
    const idToken = await readIdToken();
    if (!idToken) return;
    try {
      const doorDevice = await ensureDoorDevice();
      const response = await fetch(`${getDoorServiceUrl()}/v1/devices/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Business-Id': target,
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          businessId: target,
          kid: doorDevice.kid,
          deviceId: doorDevice.deviceId,
          publicKey: doorDevice.publicKeyJwk
        })
      });
      if (response.ok || response.status === 409) {
        enrolledRef.current = true;
        setEnrolled(true);
      }
    } catch {
      setEnrolled(false);
    }
  }, [configured]);

  const runPassPipeline = useCallback(async (jws: string, regArg?: PasskeyRegistration, proof?: ReentryProof) => {
    setBusy(true);
    try {
      let claims: TicketClaims;
      try {
        const benchmark = await benchmarkVerifyTicket(jws);
        setLocalVerifyMs(benchmark.durationMs);
        if (!benchmark.ok) {
          throw new Error(benchmark.error ?? 'Firma inválida.');
        }
        claims = await verifyTicketToken(jws);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Firma inválida.';
        setResult({
          tone: 'denied',
          title: 'FIRMA INVÁLIDA',
          message: `Verificación local fallida: ${message}`,
          detail: 'Un QR alterado, vencido o reenviado no supera la verificación local con la clave pública de Cloud Run.'
        });
        setPending(null);
        return;
      }
      const businessId = claims.businessId ?? '';
      if (businessId) {
        rememberBusinessId(businessId);
        setEdgeBusinessId(businessId);
        void enrollDevice(businessId);
        void checkEmergency(claims);
      }
      if (emergencyRef.current.blocked) {
        setResult({
          tone: 'denied',
          title: 'EMERGENCIA ACTIVA',
          message: emergencyRef.current.message,
          detail: 'La terminal respeta la revocación escalonada de la central de seguridad.'
        });
        setPending(null);
        return;
      }
      const ticketId = claims.ticketId ?? claims.sub ?? '';
      const session = await getDoorSession(ticketId);
      if (regArg) await storeDoorPasskey(ticketId, regArg);
      const registration = regArg ?? await getDoorPasskey(ticketId);

      if (session.state === 'INSIDE') {
        setResult({
          tone: 'denied',
          title: 'YA ESTÁ DENTRO',
          message: 'El titular ya está dentro del establecimiento.',
          detail: 'Usa «Marcar salida temporal» si corresponde registrar una salida.'
        });
        setPending({ jws, claims, session, proofNeeded: false });
        return;
      }

      if (session.state === 'OUTSIDE_TEMPORARY') {
        if (!isWithinReentryWindow(session.reentryExpiresAt)) {
          setResult({
            tone: 'denied',
            title: 'VENTANA EXPIRADA',
            message: conflictMessages.REENTRY_WINDOW_EXPIRED,
            detail: 'Se requiere autorización expresa del administrador o pago de cover.'
          });
          setPending({ jws, claims, session, proofNeeded: true });
          return;
        }
        if (proof && registration) {
          const valid = await verifyReentryProof(jws, proof, registration);
          if (!valid) {
            setResult({
              tone: 'denied',
              title: 'PASSKEY RECHAZADA',
              message: 'La firma biométrica de reingreso no corresponde a este dispositivo.',
              detail: 'Una captura de pantalla o video reenviado no puede generar esta firma de hardware.'
            });
            setPending({ jws, claims, session, proofNeeded: true });
            return;
          }
        } else if (registration) {
          setResult({
            tone: 'denied',
            title: 'PASSKEY REQUERIDA',
            message: 'Este pase exige reingreso con la passkey registrada en el primer ingreso.',
            detail: 'Pide al titular que genere la firma biométrica desde su pase antes de reingresar.'
          });
          setPending({ jws, claims, session, proofNeeded: true });
          return;
        } else {
          setResult({
            tone: 'review',
            title: 'REVISIÓN MANUAL',
            message: 'Este dispositivo no registró passkey: aplica el protocolo fallback de revisión manual o manilla física.',
            detail: 'Confirma el reingreso con el botón de autorización manual.'
          });
          setPending({ jws, claims, session, proofNeeded: false });
          return;
        }
        const scanResult = await dispatchAttendance(claims, 'REENTRY');
        setResult(scanResult);
        return;
      }

      const scanResult = await dispatchAttendance(claims, 'CHECK_IN');
      setResult(scanResult);
    } finally {
      setBusy(false);
    }
  }, [checkEmergency, dispatchAttendance, enrollDevice]);

  const handleScan = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const decoded = decodePassPayload(text);
      if (decoded.kind === 'code') {
        setResult({
          tone: 'denied',
          title: 'PASE NO VÁLIDO',
          message: 'Se requiere el pase digital completo con token JWS rotativo firmado criptográficamente.',
          detail: 'No se admiten códigos en texto plano por política de seguridad (AGENTS §10 / §13).'
        });
        setScanInput('');
        return;
      }
      if (decoded.kind === 'demo') {
        if (devMode) {
          setResult({
            tone: 'demo',
            title: 'MODO DEMOSTRACIÓN',
            message: 'QR de desarrollo reconocido. No incrementa aforo real ni escribe en Cloud Run.',
            detail: `Reserva simulada: ${typeof decoded.body.rid === 'string' ? decoded.body.rid : 'sin identificador'}`
          });
        } else {
          setResult({
            tone: 'denied',
            title: 'QR NO VÁLIDO',
            message: 'En producción no se aceptan códigos de demostración.'
          });
        }
        setPending(null);
        setScanInput('');
        return;
      }
      setScanInput('');
      await runPassPipeline(decoded.jws, decoded.reg, decoded.pr);
      return;
    } catch {
      setResult({ tone: 'denied', title: 'ERROR DE LECTURA', message: 'No se pudo interpretar el contenido escaneado.' });
    } finally {
      setBusy(false);
    }
  }, [busy, devMode, runPassPipeline]);

  const handleExit = useCallback(async () => {
    if (!pending?.claims || busy) return;
    setBusy(true);
    try {
      const scanResult = await dispatchAttendance(pending.claims, 'EXIT');
      setResult(scanResult);
    } finally {
      setBusy(false);
    }
  }, [busy, dispatchAttendance, pending]);

  const handleManualReentry = useCallback(async () => {
    if (!pending?.claims || busy) return;
    setBusy(true);
    try {
      const scanResult = await dispatchAttendance(pending.claims, 'MANUAL_OVERRIDE', { requestedState: 'INSIDE' });
      setResult(scanResult);
    } finally {
      setBusy(false);
    }
  }, [busy, dispatchAttendance, pending]);

  const handleFlush = useCallback(async () => {
    setBusy(true);
    try {
      const outcome = await flushAttendanceQueue();
      if (!outcome) {
        setResult({ tone: 'review', title: 'COLA EN ESPERA', message: 'Sin eventos pendientes o Cloud Run no está disponible.' });
        return;
      }
      setResult({
        tone: outcome.error ? 'review' : 'granted',
        title: outcome.error ? 'REINTENTO PENDIENTE' : 'COLA SINCRONIZADA',
        message: outcome.error
          ? outcome.error
          : `${outcome.removed.length} evento(s) enviado(s) una única vez con idempotencia por jti y deviceSequence.`,
        detail: `Pendientes restantes en el dispositivo: ${outcome.kept}`
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePanic = useCallback(async () => {
    if (!panicArmed) {
      setPanicArmed(true);
      if (panicConfirmRef.current !== null) window.clearTimeout(panicConfirmRef.current);
      panicConfirmRef.current = window.setTimeout(() => setPanicArmed(false), 5000);
      setResult({
        tone: 'review',
        title: 'BOTÓN DE PÁNICO',
        message: 'Toca otra vez en 5 segundos para confirmar el SOS de esta terminal.',
        detail: 'Acción de guardia: bloqueo local + alerta a la central si hay sesión de personal.'
      });
      return;
    }
    if (panicConfirmRef.current !== null) window.clearTimeout(panicConfirmRef.current);
    setPanicArmed(false);
    setBusy(true);
    try {
      const businessId = lastBusinessId() ?? edgeBusinessId ?? '';
      const deviceId = device?.deviceId ?? '';
      updateEmergency({
        blocked: true,
        label: 'SOS ACTIVO',
        message: 'Terminal bloqueada por botón de pánico. Escaneo suspendido hasta autorización.'
      });
      setResult({
        tone: 'review',
        title: 'SOS ENVIADO',
        message: 'Alerta local activa. Esta terminal deja de admitir ingresos.',
        detail: businessId
          ? 'Si hay Functions configuradas se eleva emergencyRevoke (scope DEVICE).'
          : 'Sin businessId guardado: solo bloqueo local de la terminal.'
      });
      if (businessId && deviceId) {
        try {
          await callFunctions('emergencyRevoke', {
            businessId,
            scope: 'DEVICE',
            deviceId,
            reason: 'Botón de pánico activado por el portero en esta terminal'
          });
        } catch (error) {
          const message = error instanceof FunctionsClientError
            ? error.message
            : 'No se pudo confirmar la revocación en la nube; el bloqueo local permanece activo.';
          setResult({
            tone: 'review',
            title: 'SOS LOCAL',
            message,
            detail: 'La central debe confirmar desde el panel de administración o Edge.'
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }, [device, edgeBusinessId, panicArmed, updateEmergency]);

  const handleClearEmergency = useCallback(() => {
    updateEmergency({
      blocked: false,
      label: 'OPERACIÓN NORMAL',
      message: 'Sin alertas de emergencia activas.'
    });
    setCameraEnabled(true);
    setResult({
      tone: 'granted',
      title: 'TERMINAL RESTABLECIDA',
      message: 'Bloqueo de seguridad levantado. El escáner está listo para operar.',
      detail: 'La cámara ha sido reactivada.'
    });
  }, [updateEmergency]);

  useEffect(() => {
    void preloadKnownDoorKeys();
  }, []);

  useEffect(() => {
    if (!isEdgeGatewayConfigured() || !device) return undefined;
    const client = new EdgeGatewayClient({
      deviceId: device.deviceId,
      businessId: edgeBusinessId,
      getSessionToken: readIdToken,
      onState: (state, detail) => {
        setEdgeState(state);
        setEdgeDetail(detail ?? '');
      },
      onMessage: (message) => {
        if (message.kind === 'revocation') {
          updateEmergency({
            blocked: true,
            label: 'REVOCACIÓN EDGE',
            message: `Revocación recibida por LAN: ${message.reason ?? message.subject ?? 'evento/terminal'}.`
          });
          void checkEmergency();
        }
      }
    });
    edgeClientRef.current = client;
    void client.connect();
    return () => {
      client.close();
      edgeClientRef.current = null;
    };
  }, [checkEmergency, device, edgeBusinessId, updateEmergency]);

  useEffect(() => {
    const stopQueue = startQueueAutoFlush();
    const unsubscribe = subscribeQueue(setQueueCount);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    let cancelled = false;
    void ensureDoorDevice().then(info => {
      if (!cancelled) setDevice(info);
      void enrollDevice();
      void checkEmergency();
    });
    const emergencyTimer = window.setInterval(() => {
      void checkEmergency();
    }, 20000);
    const clockTimer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => {
      cancelled = true;
      stopQueue();
      unsubscribe();
      window.clearInterval(emergencyTimer);
      window.clearInterval(clockTimer);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [checkEmergency, enrollDevice]);

  const pendingWindow = useMemo(() => {
    if (!pending?.session) return null;
    return pending.session.reentryExpiresAt;
  }, [pending]);

  const canExit = Boolean(pending?.claims) && pending?.session.state === 'INSIDE';
  const canManualReentry = Boolean(pending?.claims) && pending?.session.state === 'OUTSIDE_TEMPORARY';

  return (
    <div className="glass-card door-pwa-card" style={{
      border: `1px solid ${emergency.blocked ? 'rgba(244, 63, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`
    }}>
      <div className="door-status-ribbon">
        <span className="door-status-pill" style={{ background: 'rgba(255,255,255,0.06)', color: modeColor, border: `1px solid ${modeColor}55` }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: modeColor, boxShadow: `0 0 8px ${modeColor}` }} />
          {modeLabel}
        </span>
        <span className="door-status-pill" style={{
          background: online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          color: online ? '#34d399' : '#fda4af',
          border: `1px solid ${online ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)'}`
        }}>
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          {online ? 'EN LÍNEA' : 'SIN RED'}
        </span>
        <span className="door-status-pill" style={{ background: 'rgba(0, 240, 255, 0.08)', color: 'var(--accent)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
          <CloudOff size={12} />
          COLA: {queueCount}
        </span>
        <span className="door-status-pill" style={{
          background: emergency.blocked ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.1)',
          color: emergency.blocked ? '#fda4af' : '#34d399',
          border: `1px solid ${emergency.blocked ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.3)'}`
        }}>
          {emergency.blocked ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
          {emergency.label}
        </span>
        <span className="door-status-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Smartphone size={12} />
          {device ? `${device.deviceId.slice(0, 14)}…` : 'TERMINAL…'}
          {configured && enrolled ? ' · OK' : ''}
        </span>
        <span className="door-status-pill" style={{
          background: edgeState === 'connected' ? 'rgba(16,185,129,0.12)' : edgeState === 'disabled' ? 'rgba(255,255,255,0.05)' : 'rgba(245,158,11,0.12)',
          color: edgeState === 'connected' ? '#34d399' : edgeState === 'disabled' ? 'var(--text-dim)' : '#fbbf24',
          border: `1px solid ${edgeState === 'connected' ? 'rgba(16,185,129,0.35)' : edgeState === 'disabled' ? 'rgba(255,255,255,0.1)' : 'rgba(245,158,11,0.35)'}`
        }}>
          EDGE {edgeState.toUpperCase()}
          {edgeDetail ? ` · ${edgeDetail.slice(0, 18)}` : ''}
        </span>
        {typeof localVerifyMs === 'number' && (
          <span className="door-status-pill" style={{
            background: localVerifyMs < 50 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            color: localVerifyMs < 50 ? '#34d399' : '#fbbf24',
            border: `1px solid ${localVerifyMs < 50 ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`
          }}>
            JWS {localVerifyMs.toFixed(1)} ms
          </span>
        )}
      </div>

      {emergency.blocked && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.22), rgba(45, 10, 18, 0.4))',
          border: '1.5px solid rgba(244, 63, 94, 0.6)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          color: '#fda4af',
          fontSize: '0.84rem',
          fontWeight: 700
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{emergency.message}</span>
          </div>
          <button
            type="button"
            onClick={handleClearEmergency}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.76rem',
              color: '#34d399',
              borderColor: 'rgba(52, 211, 153, 0.45)',
              background: 'rgba(16, 185, 129, 0.18)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            Levantar bloqueo
          </button>
        </div>
      )}

      {/* Visor de cámara QR en vivo */}
      <QrCameraScanner enabled={cameraEnabled && !busy && !emergency.blocked} onDetect={(text) => void handleScan(text)} />

      {/* Recuadro de espera: solo visible si la cámara está apagada o la terminal está bloqueada */}
      {(!cameraEnabled || emergency.blocked) && (
        <div style={{
          position: 'relative',
          height: emergency.blocked ? '180px' : '150px',
          background: 'radial-gradient(circle at 50% 50%, rgba(229, 181, 79, 0.08) 0%, #08080c 100%)',
          borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${emergency.blocked ? 'rgba(244, 63, 94, 0.45)' : 'rgba(229, 181, 79, 0.25)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          overflow: 'hidden'
        }}>
          <div className="laser-line" />
          <ScanLine size={38} color={emergency.blocked ? 'rgba(244, 63, 94, 0.7)' : 'rgba(229, 181, 79, 0.5)'} style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: emergency.blocked ? '#fda4af' : 'var(--accent)', letterSpacing: '0.04em' }}>
            {emergency.blocked ? 'TERMINAL SUSPENDIDA (SOS ACTIVO)' : 'CÁMARA EN ESPERA'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0 16px', marginTop: '4px' }}>
            {emergency.blocked
              ? 'La terminal se bloqueó por seguridad. Para reactivar el escaneo presiona «Reactivar terminal».'
              : 'Activa la cámara o introduce el código JWS manualmente abajo'}
          </div>
          {emergency.blocked && (
            <button
              type="button"
              onClick={handleClearEmergency}
              className="btn-primary"
              style={{
                marginTop: '12px',
                padding: '8px 18px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderColor: '#34d399',
                color: '#ffffff',
                fontWeight: 800,
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                cursor: 'pointer'
              }}
            >
              Reactivar terminal
            </button>
          )}
        </div>
      )}

      {/* Botones táctiles primarios de cámara y pánico */}
      <div className="door-touch-actions">
        {emergency.blocked ? (
          <button
            type="button"
            className="door-btn-touch btn-primary"
            onClick={handleClearEmergency}
            style={{
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: '1px solid rgba(52, 211, 153, 0.6)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
              fontSize: '0.86rem',
              fontWeight: 800
            }}
          >
            <ShieldCheck size={18} />
            <span>Levantar bloqueo y reanudar escáner</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`door-btn-touch ${cameraEnabled ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCameraEnabled(value => !value)}
              disabled={emergency.blocked}
            >
              <ScanLine size={16} />
              <span>{cameraEnabled ? 'Pausar cámara' : 'Activar cámara'}</span>
            </button>
            <button
              type="button"
              className={`door-btn-touch ${panicArmed ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => void handlePanic()}
              disabled={busy}
              style={{
                borderColor: panicArmed ? '#f43f5e' : undefined,
                color: panicArmed ? '#fff' : undefined,
                background: panicArmed ? 'rgba(244, 63, 94, 0.45)' : undefined
              }}
            >
              <Siren size={16} />
              <span>{panicArmed ? 'CONFIRMAR SOS' : 'Botón de pánico'}</span>
            </button>
          </>
        )}
      </div>

      {/* Formulario de validación manual touch-friendly */}
      <form
        onSubmit={event => {
          event.preventDefault();
          void handleScan(scanInput);
        }}
        className="door-manual-form"
      >
        <input
          type="text"
          placeholder="CÓDIGO O TOKEN JWS…"
          value={scanInput}
          onChange={event => setScanInput(event.target.value)}
          className="door-manual-input"
        />
        <button type="submit" className="btn-primary door-manual-submit" disabled={busy}>
          <ScanLine size={16} />
          <span>{busy ? 'Validando…' : 'Validar'}</span>
        </button>
      </form>

      {/* Botones secundarios de operaciones de puerta */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          type="button"
          className="btn-secondary door-btn-touch"
          onClick={() => void handleFlush()}
          disabled={busy}
          style={{ flex: '1 1 140px', minHeight: '40px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={14} />
          <span>Sincronizar cola ({queueCount})</span>
        </button>
        {canExit && (
          <button
            type="button"
            className="btn-secondary door-btn-touch"
            onClick={() => void handleExit()}
            disabled={busy}
            style={{ flex: '1 1 140px', minHeight: '40px', fontSize: '0.78rem', borderColor: '#f59e0b' }}
          >
            <LogOut size={14} />
            <span>Salida temporal</span>
          </button>
        )}
        {canManualReentry && (
          <button
            type="button"
            className="btn-gold door-btn-touch"
            onClick={() => void handleManualReentry()}
            disabled={busy}
            style={{ flex: '1 1 140px', minHeight: '40px', fontSize: '0.78rem' }}
          >
            <KeyRound size={14} />
            <span>Reingreso manual</span>
          </button>
        )}
      </div>

      {typeof pendingWindow === 'number' && pending?.session.state === 'OUTSIDE_TEMPORARY' && (
        <div style={{ fontSize: '0.74rem', color: passkeyWindowOk(pendingWindow, nowMs) ? '#34d399' : '#fda4af', marginBottom: '12px', fontWeight: 700 }}>
          {passkeyWindowOk(pendingWindow, nowMs)
            ? `Ventana de reingreso activa · expira en ${Math.max(0, Math.ceil((pendingWindow - nowMs) / 60000))} min`
            : 'La ventana de reingreso de 30 minutos expiró'}
        </div>
      )}

      {/* Tarjeta de resultado con feedback visual de alto impacto */}
      {result && (() => {
        const palette = result.tone === 'granted'
          ? { border: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', bg: 'linear-gradient(145deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 40, 24, 0.35) 100%)', title: '#34d399', icon: <UserCheck size={32} color="#10b981" /> }
          : result.tone === 'demo'
            ? { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)', bg: 'linear-gradient(145deg, rgba(251, 191, 36, 0.18) 0%, rgba(45, 30, 6, 0.35) 100%)', title: '#fbbf24', icon: <ScanLine size={32} color="#fbbf24" /> }
            : result.tone === 'review'
              ? { border: '#e5b54f', glow: 'rgba(229, 181, 79, 0.35)', bg: 'linear-gradient(145deg, rgba(229, 181, 79, 0.18) 0%, rgba(45, 34, 8, 0.35) 100%)', title: '#fde68a', icon: <ShieldAlert size={32} color="#e5b54f" /> }
              : { border: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', bg: 'linear-gradient(145deg, rgba(244, 63, 94, 0.22) 0%, rgba(45, 10, 18, 0.35) 100%)', title: '#fda4af', icon: <ShieldAlert size={32} color="#f43f5e" /> };
        return (
          <div className="glass-card door-result-card" style={{
            border: `2px solid ${palette.border}`,
            background: palette.bg,
            boxShadow: `0 0 32px ${palette.glow}`
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{palette.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: palette.title, letterSpacing: '0.02em', margin: 0 }}>
                    {result.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {result.synced && <span className="badge badge-checkedin">SINCRONIZADO</span>}
                    {result.queued && <span className="badge badge-held">EN COLA OFFLINE</span>}
                    {result.tone === 'demo' && <span className="badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>DEMO</span>}
                  </div>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#ffffff', margin: '6px 0 0', fontWeight: 600, lineHeight: 1.35 }}>{result.message}</p>
                {result.detail && (
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', margin: '6px 0 0', lineHeight: 1.3 }}>{result.detail}</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {demoReservations.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Validación local de códigos (modo demostración):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {demoReservations.map(reservation => (
              <button
                key={reservation.code}
                type="button"
                onClick={() => {
                  void handleScan(JSON.stringify({ rid: reservation.code, demo: true }));
                }}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)' }}
              >
                <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>#{reservation.code}</span>
                <span style={{ color: '#fff' }}>· Mesa {reservation.table_code} ({reservation.customer_name})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
        <LogIn size={13} color="var(--accent)" />
        <span>
          Cola cifrada con AES-GCM en IndexedDB · reintento idempotente por jti/deviceSequence · sin duplicación de aforo
        </span>
      </div>
    </div>
  );
};

export default DoorPwaApp;
