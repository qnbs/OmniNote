
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, X } from './icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.sectionName || 'component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
                    <AlertTriangle className="h-5 w-5" />
                    <h3>Something went wrong in {this.props.sectionName || 'this section'}</h3>
                </div>
                <button onClick={this.handleReset} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 dark:text-red-400">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <p className="mt-2 text-red-600 dark:text-red-400 text-xs font-mono bg-white/50 dark:bg-black/20 p-2 rounded">
                {this.state.error?.message || 'Unknown error'}
            </p>
            <button 
                onClick={this.handleReset}
                className="mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
                Try Again
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
