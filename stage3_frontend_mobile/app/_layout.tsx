import React, { useEffect, Component, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, RootState, AppDispatch } from '../src/store';
import { sqliteService } from '../src/services/sqlite_db';
import { supabase } from '../src/services/supabase';
import { authSuccess, signOutSuccess } from '../src/store/slices/authSlice';
import { ErrorScreen } from '../src/components/ErrorScreen';
import { lightTheme, darkTheme } from '../src/store/slices/themeSlice';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <PaperProvider theme={lightTheme}>
          <ErrorScreen
            errorTitle="Connection or Runtime Error"
            errorMessage={this.state.error?.message || 'net::ERR_CONNECTION_REFUSED'}
            onRetry={this.handleRetry}
            onContinueOffline={this.handleRetry}
          />
        </PaperProvider>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <PaperProvider theme={lightTheme}>
      <ErrorScreen
        errorTitle="Connection Refused: Local Service Offline"
        errorMessage={error?.message || 'net::ERR_CONNECTION_REFUSED'}
        onRetry={retry}
      />
    </PaperProvider>
  );
}

function ThemedNavigationContainer() {
  const dispatch = useDispatch<AppDispatch>();
  const themeMode = useSelector((state: RootState) => state.theme.themeMode);
  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Supabase Auth State Change Listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        dispatch(
          authSuccess({
            user: {
              id: session.user.id,
              email: session.user.email || 'user@supabase.io',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Supabase User',
              role: 'Authenticated Officer',
              avatar_url: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider || 'supabase'
            },
            session
          })
        );
      } else if (event === 'SIGNED_OUT') {
        dispatch(signOutSuccess());
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <PaperProvider theme={activeTheme}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <RootErrorBoundary>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: activeTheme.colors.background },
            headerTintColor: activeTheme.colors.onSurface,
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: activeTheme.colors.background }
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'OCR2 Mobile Enterprise',
              headerShown: false
            }}
          />
          <Stack.Screen
            name="auth"
            options={{
              title: 'Supabase Authentication',
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              title: 'Scan Audit History',
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="users"
            options={{
              title: 'Multi-User SQLite Accounts',
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="error"
            options={{
              title: 'System Diagnostics',
              presentation: 'modal'
            }}
          />
        </Stack>
      </RootErrorBoundary>
    </PaperProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    sqliteService.initDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <ThemedNavigationContainer />
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
