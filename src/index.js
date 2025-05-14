import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Error boundary for the entire application
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh
          </button>
          <details style={{ marginTop: '20px' }}>
            <summary>Error Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  // Get the root element
  const container = document.getElementById('root');
  const root = createRoot(container);

  // Render the app using the new createRoot API and wrap with error boundary
  root.render(
    <ErrorBoundary>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </ErrorBoundary>
  );
} catch (error) {
  console.error("Error during application initialization:", error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; margin: 20px; border: 1px solid #f5c6cb; border-radius: 4px; background-color: #f8d7da; color: #721c24">
      <h2>Failed to initialize application</h2>
      <p>There was a critical error starting the application. Please try again later.</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px">
        Refresh
      </button>
    </div>
  `;
}