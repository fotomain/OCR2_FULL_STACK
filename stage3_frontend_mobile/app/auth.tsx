import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Surface, Avatar, Chip, SegmentedButtons, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  setAuthLoading,
  setAuthError,
  authSuccess,
  signOutSuccess
} from '@/store/slices/authSlice';
import { supabaseAuthService } from '@/services/supabase';

// noinspection SpellCheckingInspection,JSUnusedGlobalSymbols
export default function SupabaseAuthScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme() as any;

  const { currentUser, isAuthenticated, isLoading, authError, allUsers } = useSelector(
    (state: RootState) => state.auth
  );

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1. Google OAuth Sign-In Handler
  const handleGoogleSignIn = async () => {
    dispatch(setAuthLoading(true));
    try {
      const { user, session, error } = await supabaseAuthService.signInWithGoogle();
      if (error) {
        dispatch(setAuthError(error));
        return;
      }
      if (user) {
        dispatch(
          authSuccess({
            user: {
              id: user.id,
              email: user.email || 'google.user@corporate.org',
              name: user.user_metadata?.full_name || 'Google Corporate User',
              role: 'Corporate Officer',
              avatar_url: user.user_metadata?.avatar_url,
              provider: 'google'
            },
            session
          })
        );
        router.back();
      }
    } catch (err: any) {
      dispatch(setAuthError(err.message || 'Google Sign-In failed'));
    }
  };

  // 2. Register with Email & Password Handler
  const handleRegister = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      dispatch(setAuthError('Please fill in all registration fields.'));
      return;
    }
    if (password !== confirmPassword) {
      dispatch(setAuthError('Passwords do not match.'));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const { user, session, error } = await supabaseAuthService.signUp(email, password, fullName);
      if (error) {
        dispatch(setAuthError(error));
        return;
      }
      if (user) {
        dispatch(
          authSuccess({
            user: {
              id: user.id,
              email: user.email || email.trim(),
              name: fullName.trim(),
              role: 'Registered Analyst',
              provider: 'supabase'
            },
            session
          })
        );
        router.back();
      }
    } catch (err: any) {
      dispatch(setAuthError(err.message || 'Registration failed'));
    }
  };

  // 3. Sign In with Email & Password Handler
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password) {
      dispatch(setAuthError('Please enter both email and password.'));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const { user, session, error } = await supabaseAuthService.signInWithEmail(email, password);
      if (error) {
        dispatch(setAuthError(error));
        return;
      }
      if (user) {
        dispatch(
          authSuccess({
            user: {
              id: user.id,
              email: user.email || email.trim(),
              name: user.user_metadata?.full_name || email.split('@')[0],
              role: 'Senior Investigator',
              provider: 'supabase'
            },
            session
          })
        );
        router.back();
      }
    } catch (err: any) {
      dispatch(setAuthError(err.message || 'Sign In failed'));
    }
  };

  // 4. Sign Out Handler
  const handleSignOut = async () => {
    dispatch(setAuthLoading(true));
    await supabaseAuthService.signOut();
    dispatch(signOutSuccess());
  };

  // 5. Preset Switcher
  const handleSelectPreset = (user: any) => {
    dispatch(authSuccess({ user }));
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* Current User Profile Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
        <Card.Title
          title="Supabase Authentication State"
          subtitle={isAuthenticated ? 'Active User Session' : 'Guest / Not Signed In'}
          titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
          subtitleStyle={{ color: theme.colors.textDim }}
          left={(props) => (
            <Avatar.Text
              size={40}
              label={currentUser.name.substring(0, 2).toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
              color="#fff"
            />
          )}
        />
        <Card.Content>
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.colors.textDim }]}>User Email:</Text>
            <Text style={[styles.profileVal, { color: theme.colors.textMain, fontWeight: '700' }]}>{currentUser.email}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.colors.textDim }]}>Full Name:</Text>
            <Text style={[styles.profileVal, { color: theme.colors.textMain }]}>{currentUser.name}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: theme.colors.textDim }]}>Auth Provider:</Text>
            <Chip compact style={{ backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}>
              {currentUser.provider || 'supabase'}
            </Chip>
          </View>

          {isAuthenticated && (
            <Button
              mode="outlined"
              icon="logout"
              onPress={handleSignOut}
              style={[styles.btnSignOut, { borderColor: '#ef4444' }]}
              textColor="#ef4444"
            >
              Sign Out (Supabase)
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Google OAuth & Email Auth Box */}
      <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
        <Card.Title
          title="Sign In / Register"
          subtitle="Supabase Auth with Google OAuth & Email"
          titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
          subtitleStyle={{ color: theme.colors.textDim }}
        />
        <Card.Content>
          {/* Google OAuth Sign-In Button */}
          <Button
            mode="contained"
            icon="google"
            loading={isLoading}
            onPress={handleGoogleSignIn}
            style={styles.btnGoogle}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontWeight: 'bold', fontSize: 14, color: '#ffffff' }}
          >
            Continue with Google (Supabase)
          </Button>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textDim }]}>OR EMAIL & PASSWORD</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
          </View>

          {/* Auth Mode Toggle: Sign In vs Register */}
          <SegmentedButtons
            value={authMode}
            onValueChange={(val) => setAuthMode(val as any)}
            buttons={[
              { value: 'signin', label: 'Sign In' },
              { value: 'register', label: 'Register' }
            ]}
            style={{ marginBottom: 16 }}
          />

          {authError && (
            <Surface style={[styles.errorBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]} elevation={1}>
              <IconButton icon="alert-circle" iconColor="#dc2626" size={20} />
              <Text style={{ color: '#dc2626', fontSize: 12, flex: 1 }}>{authError}</Text>
            </Surface>
          )}

          {authMode === 'register' && (
            <TextInput
              mode="outlined"
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              textColor={theme.colors.textMain}
            />
          )}

          <TextInput
            mode="outlined"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            textColor={theme.colors.textMain}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            textColor={theme.colors.textMain}
          />

          {authMode === 'register' && (
            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              textColor={theme.colors.textMain}
            />
          )}

          <Button
            mode="contained"
            icon={authMode === 'register' ? 'account-plus' : 'login'}
            loading={isLoading}
            onPress={authMode === 'register' ? handleRegister : handleEmailSignIn}
            style={[styles.btnAuthSubmit, { backgroundColor: theme.colors.primary }]}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontWeight: 'bold' }}
          >
            {authMode === 'register' ? 'Register Account (Supabase)' : 'Sign In with Email'}
          </Button>
        </Card.Content>
      </Card>

      {/* Quick Switcher Presets */}
      <Text variant="titleSmall" style={[styles.presetsTitle, { color: theme.colors.textDim }]}>
        QUICK PRESET PROFILES
      </Text>
      <View style={{ gap: 8 }}>
        {allUsers.map((u) => (
          <Surface
            key={u.email}
            style={[
              styles.presetCard,
              { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder },
              currentUser.email === u.email && { borderColor: theme.colors.primary, borderWidth: 1.5 }
            ]}
            elevation={1}
          >
            <View style={styles.presetContent}>
              <Avatar.Text size={32} label={u.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primary }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.presetName, { color: theme.colors.textMain }]}>{u.name}</Text>
                <Text style={[styles.presetEmail, { color: theme.colors.textDim }]}>{u.email} • {u.role}</Text>
              </View>
              <Button
                mode="text"
                compact
                onPress={() => handleSelectPreset(u)}
                textColor={theme.colors.primary}
              >
                Switch
              </Button>
            </View>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center'
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  profileLabel: {
    fontSize: 12
  },
  profileVal: {
    fontSize: 12
  },
  btnSignOut: {
    marginTop: 14,
    borderRadius: 8
  },
  btnGoogle: {
    backgroundColor: '#4285f4',
    borderRadius: 10,
    marginBottom: 16
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14
  },
  dividerLine: {
    flex: 1,
    height: 1
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 10,
    letterSpacing: 0.5
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  },
  input: {
    marginBottom: 10
  },
  btnAuthSubmit: {
    borderRadius: 10,
    marginTop: 6
  },
  presetsTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8
  },
  presetCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  presetContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  presetName: {
    fontWeight: 'bold',
    fontSize: 12
  },
  presetEmail: {
    fontSize: 11
  }
});
