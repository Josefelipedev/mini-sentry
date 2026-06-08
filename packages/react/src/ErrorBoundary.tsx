import React from 'react';
import { captureException } from '@mini-sentry/browser';

interface State {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, {
      componentStack: info.componentStack ?? undefined,
    });
    this.props.onError?.(error, info);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (!fallback) return <p>Something went wrong.</p>;
    if (typeof fallback === 'function') return fallback(this.state.error!);
    return fallback;
  }
}
