import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorScreen } from '@/components/ErrorScreen';

export default function ErrorRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; message?: string; url?: string }>();

  return (
    <ErrorScreen
      errorTitle={params.title || 'Connection Refused: Local Service Offline'}
      errorMessage={params.message || 'net::ERR_CONNECTION_REFUSED - Failed to reach server endpoint'}
      failedUrl={params.url || 'http://localhost:8081 or http://127.0.0.1:8000'}
      onRetry={() => router.replace('/')}
      onContinueOffline={() => router.replace('/')}
    />
  );
}
