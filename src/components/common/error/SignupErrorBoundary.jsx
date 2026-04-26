import React, { Component } from 'react';

class SignupErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Signup Error:', error);
    console.error('Error Info:', errorInfo);

    // Handle specific error types
    if (error.response) {
      switch (error.response.status) {
        case 429:
          console.log('Rate limit hit, implementing delay...');
          // Implement exponential backoff
          setTimeout(() => {
            this.handleRetry();
          }, Math.min(1000 * Math.pow(2, this.state.retryCount), 10000));
          break;
        case 500:
          console.log('Server error, waiting before retry...');
          setTimeout(() => {
            this.handleRetry();
          }, 3000);
          break;
        default:
          console.log('Unhandled error status:', error.response.status);
      }
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="ml-3 text-lg font-semibold text-red-800">Something went wrong</h2>
          </div>
          
          <p className="text-red-600 mb-4">
            {this.state.retryCount > 0 
              ? "We're experiencing high traffic. Please wait a moment..." 
              : "Please try again or contact support if the problem persists."}
          </p>

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { SignupErrorBoundary };
