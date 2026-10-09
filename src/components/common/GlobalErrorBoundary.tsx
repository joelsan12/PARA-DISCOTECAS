import { Component, type ErrorInfo, type ReactNode } from 'react';
import { NightflowInterruptionScreen } from './NightflowInterruptionScreen';
import {
  buildCrashReport,
  crashRef,
  normalizeError,
  recordCrash,
  type NormalizedError,
} from '../../lib/crashReport';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export interface GlobalErrorBoundaryState {
  error: NormalizedError | null;
  componentStack?: string;
}

/**
 * Frontera global de errores (E4): ninguna excepción de render puede dejar
 * una pantalla en blanco. Registra el crash en la auditoría local del
 * dispositivo (con referencia estable para soporte) y ofrece reintento o
 * recarga sin perder diagnóstico.
 */
export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: unknown): Partial<GlobalErrorBoundaryState> {
    return { error: normalizeError(error) };
  }

  public componentDidCatch(error: unknown, info: ErrorInfo): void {
    const componentStack = info.componentStack ?? undefined;
    this.setState({ componentStack });
    recordCrash(buildCrashReport({ error, componentStack }));
    const normalized = normalizeError(error);
    console.error('[NIGHTFLOW] crash capturado por el ErrorBoundary:', normalized.message, componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null, componentStack: undefined });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    const { error, componentStack } = this.state;
    if (!error) {
      return this.props.children;
    }
    const ref = crashRef(error);

    return (
      <NightflowInterruptionScreen
        mode="ERROR"
        error={error}
        componentStack={componentStack}
        refCode={ref}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
      />
    );
  }
}

export default GlobalErrorBoundary;

