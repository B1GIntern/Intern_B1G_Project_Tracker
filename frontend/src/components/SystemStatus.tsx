import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Server, Database } from 'lucide-react';

interface StatusData {
  success: boolean;
  backend?: {
    message: string;
    status: string;
  };
  database?: {
    message: string;
    status: string;
  };
  timestamp?: string;
}

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/status/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'running' || status === 'connected' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading && !status) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to connect to backend</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button 
              onClick={fetchStatus}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backend Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Backend</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status?.backend?.status || '')}
            {getStatusBadge(status?.backend?.status || '')}
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="font-medium">Database</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status?.database?.status || '')}
            {getStatusBadge(status?.database?.status || '')}
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 text-sm">
          {status?.backend?.message && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
              {status.backend.message}
            </div>
          )}
          {status?.database?.message && (
            <div className={`p-2 border rounded ${
              status.database.status === 'connected' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {status.database.message}
            </div>
          )}
        </div>

        {/* Last Updated */}
        {status?.timestamp && (
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </div>
        )}

        {/* Refresh Button */}
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh Status
        </button>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
