import React, { useEffect, Component, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { Provider as ReduxProvider, useSelector, useDispatch } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, RootState, AppDispatch } from '@/store';
import { sqliteService } from '@/services/sqlite_db';
import { supabase } from '@/services/supabase';
import { authSuccess, signOutSuccess } from '@/store/slices/authSlice';
import { ErrorScreen } from '@/components/ErrorScreen';
import { lightTheme, darkTheme } from '@/store/slices/themeSlice';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// noinspection JSUnusedGlobalSymbols
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <PaperProvider theme={lightTheme}>
      <ErrorScreen
        errorTitle="Connection Refused: Local Service Offline"
        errorMessage={error?.message || 'net::ERR_CONNECTION_REFUSED'}
        onRetry={retry}
        onContinueOffline={retry}
      />
    </PaperProvider>
  );
}

class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
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
        <ErrorBoundary
          error={this.state.error || new Error('Connection or Runtime Error')}
          retry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

// noinspection SpellCheckingInspection
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

// noinspection JSUnusedGlobalSymbols
export default function RootLayout() {
  useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    void sqliteService.initDatabase().catch((error: unknown) => {
      console.error('Failed to initialize SQLite database:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <ThemedNavigationContainer />
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
