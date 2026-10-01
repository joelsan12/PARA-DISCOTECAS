import { Component, type ErrorInfo, type ReactNode } from 'react';
import { NightflowLogoMark } from './NightflowLogo';
import {
  buildCrashReport,
  crashRef,
  normalizeError,
  recordCrash,
  type NormalizedError,
} from '../../lib/crashReport';
import '../../styles/errorBoundary.css';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export interface GlobalErrorBoundaryState {
  error: NormalizedError | null;
  componentStack?: string;
  copied: boolean;
}

/**
 * Frontera global de errores (E4): ninguna excepción de render puede dejar
 * una pantalla en blanco. Registra el crash en el auditoría local del
 * dispositivo (con referencia estable para soporte) y ofrece reintento o
 * recarga sin perder diagnóstico.
 */
export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = { error: null, copied: false };

  public static getDerivedStateFromError(error: unknown): Partial<GlobalErrorBoundaryState> {
    return { error: normalizeError(error), copied: false };
  }

  public componentDidCatch(error: unknown, info: ErrorInfo): void {
    const componentStack = info.componentStack ?? undefined;
    this.setState({ componentStack });
    recordCrash(buildCrashReport({ error, componentStack }));
    const normalized = normalizeError(error);
    console.error('[NIGHTFLOW] crash capturado por el ErrorBoundary:', normalized.message, componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null, componentStack: undefined, copied: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleCopy = async (): Promise<void> => {
    const { error, componentStack } = this.state;
    if (!error) return;
    const report = buildCrashReport({ error, componentStack });
    const text = [
      `Referencia: ${report.ref}`,
      `${report.name}: ${report.message}`,
      report.url ? `URL: ${report.url}` : undefined,
      report.at ? `Fecha: ${report.at}` : undefined,
      report.stack ? `\n${report.stack}` : undefined,
      report.componentStack ? `\n${report.componentStack}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 2200);
    } catch {
      // Sin permiso de portapapeles: el detalle sigue disponible abajo.
    }
  };

  public render(): ReactNode {
    const { error, componentStack, copied } = this.state;
    if (!error) {
      return this.props.children;
    }
    const ref = crashRef(error);
    const details = [error.stack, componentStack].filter(Boolean).join('\n\n') || `${error.name}: ${error.message}`;

    return (
      <div className="nf-crash" role="alert" aria-live="assertive">
        <div className="nf-crash__card">
          <div className="nf-crash__mark">
            <NightflowLogoMark size={56} theme="gold" />
          </div>

          <p className="nf-crash__eyebrow">Nightflow · Modo seguro</p>
          <h1 className="nf-crash__title">La noche se ha interrumpido</h1>
          <p className="nf-crash__body">
            Algo falló en esta pantalla. Tu sesión y tus datos siguen intactos: el diagnóstico quedó
            guardado en este dispositivo con la referencia de auditoría.
          </p>

          <span className="nf-crash__ref" title="Referencia de auditoría para soporte">
            REF {ref}
          </span>

          <div className="nf-crash__actions">
            <button type="button" className="nf-crash__button nf-crash__button--primary" onClick={this.handleRetry}>
              Reintentar
            </button>
            <button type="button" className="nf-crash__button nf-crash__button--ghost" onClick={this.handleReload}>
              Recargar
            </button>
            <button
              type="button"
              className="nf-crash__button nf-crash__button--ghost"
              onClick={() => void this.handleCopy()}
            >
              {copied ? 'Copiado ✓' : 'Copiar diagnóstico'}
            </button>
          </div>

          <details className="nf-crash__details">
            <summary className="nf-crash__summary">Detalles técnicos</summary>
            <pre className="nf-crash__stack">{details}</pre>
          </details>

          <p className="nf-crash__footnote">
            Auditoría local · sin datos personales enviados a terceros
          </p>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
