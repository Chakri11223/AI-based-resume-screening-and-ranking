import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="p-8 space-y-4 max-w-2xl mx-auto">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">
        An error occurred while loading the page. Please try again.
      </p>
      {error && (
        <details className="text-left bg-red-50 p-4 rounded-lg mb-6">
          <summary className="cursor-pointer font-medium text-red-800">Error Details</summary>
          <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{error.message}</pre>
        </details>
      )}
      <button
        onClick={resetError}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default ErrorBoundary;
