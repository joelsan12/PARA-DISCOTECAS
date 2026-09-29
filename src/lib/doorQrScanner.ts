export type QrScannerStatus = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied' | 'error';

export interface QrScannerHandlers {
  onDetect: (text: string) => void;
  onStatus?: (status: QrScannerStatus, message?: string) => void;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const getBarcodeDetectorCtor = (): BarcodeDetectorCtor | null => {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === 'function' ? ctor : null;
};

export const isQrCameraSupported = (): boolean => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  return getBarcodeDetectorCtor() !== null;
};

export class DoorQrCameraScanner {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private detector: BarcodeDetectorLike | null = null;
  private rafId: number | null = null;
  private running = false;
  private lastValue = '';
  private lastDetectAt = 0;
  private handlers: QrScannerHandlers;

  constructor(handlers: QrScannerHandlers) {
    this.handlers = handlers;
  }

  async start(video: HTMLVideoElement): Promise<void> {
    if (this.running) return;
    this.handlers.onStatus?.('starting');
    const Ctor = getBarcodeDetectorCtor();
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      this.handlers.onStatus?.('unsupported', 'Este navegador no soporta escaneo QR con cámara (BarcodeDetector).');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch {
      this.handlers.onStatus?.('denied', 'Permiso de cámara denegado. Usa el pegado manual del pase.');
      return;
    }
    this.video = video;
    video.srcObject = this.stream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;
    try {
      await video.play();
    } catch {
      this.handlers.onStatus?.('error', 'No se pudo iniciar la vista previa de la cámara.');
      await this.stop();
      return;
    }
    this.detector = new Ctor({ formats: ['qr_code'] });
    this.canvas = document.createElement('canvas');
    this.running = true;
    this.handlers.onStatus?.('scanning');
    this.tick();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.detector = null;
    this.canvas = null;
    this.handlers.onStatus?.('idle');
  }

  private tick = (): void => {
    if (!this.running || !this.video || !this.detector || !this.canvas) return;
    const video = this.video;
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      this.canvas.width = width;
      this.canvas.height = height;
      const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        void this.detector.detect(this.canvas)
          .then((codes) => {
            const raw = codes[0]?.rawValue;
            if (!raw) return;
            const now = Date.now();
            if (raw === this.lastValue && now - this.lastDetectAt < 1500) return;
            this.lastValue = raw;
            this.lastDetectAt = now;
            this.handlers.onDetect(raw);
          })
          .catch(() => undefined);
      }
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}
