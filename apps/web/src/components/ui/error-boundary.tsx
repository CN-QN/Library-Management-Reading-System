'use client';

import React from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full py-8 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl bg-destructive/5 text-destructive">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
          <h3 className="font-semibold text-lg">Đã có lỗi xảy ra</h3>
          <p className="text-sm opacity-80 max-w-sm mt-1 mb-4">
            Không thể tải dữ liệu cho phần này. Vui lòng thử lại sau.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
