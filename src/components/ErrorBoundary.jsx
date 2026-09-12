import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 paper-card rounded-3xl text-center space-y-4">
          <h2 className="font-display text-2xl text-gold">Something went wrong</h2>
          <p className="text-ink/75 text-sm">
            An error occurred while rendering this table. You can return to the lobby or refresh.
          </p>
          {this.state.error?.message && (
            <p className="text-xs font-mono text-gold bg-walnut/50 p-2 rounded-lg break-all">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/lobby';
              }}
            >
              Go to lobby
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
