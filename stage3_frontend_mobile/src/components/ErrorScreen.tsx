import React from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Card, Button, Text, Surface, IconButton, Divider } from 'react-native-paper';

interface ErrorScreenProps {
  errorTitle?: string;
  errorMessage?: string;
  failedUrl?: string;
  onRetry?: () => void;
  onContinueOffline?: () => void;
}

export function ErrorScreen({
  errorTitle = 'Connection Refused: Service Offline',
  errorMessage = 'Failed to load resource: net::ERR_CONNECTION_REFUSED',
  failedUrl = 'http://localhost:8081 or http://127.0.0.1:8000',
  onRetry,
  onContinueOffline
}: ErrorScreenProps) {
  const handleReload = () => {
    if (onRetry) {
      onRetry();
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleOpenWebDashboard = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open('http://127.0.0.1:8080', '_blank');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      <Surface style={styles.surfaceCard} elevation={3}>
        {/* Header Icon */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <IconButton icon="alert-circle-outline" iconColor="#ef4444" size={44} />
          </View>
          <Text variant="headlineSmall" style={styles.titleText}>
            {errorTitle}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitleText}>
            The application could not establish a connection to the required local service.
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Error Details Box */}
        <Card style={styles.errorBox}>
          <Card.Content>
            <View style={styles.badgeRow}>
              <Text style={styles.errorBadge}>net::ERR_CONNECTION_REFUSED</Text>
              <Text style={styles.portBadge}>Port 8081 / 8000</Text>
            </View>
            <Text style={styles.errorLogText}>
              {errorMessage}
            </Text>
            <Text style={styles.targetUrlText}>
              Target: {failedUrl}
            </Text>
          </Card.Content>
        </Card>

        {/* What Happened & Diagnostic Steps */}
        <View style={styles.diagnosticSection}>
          <Text variant="titleMedium" style={styles.sectionHeader}>
            <IconButton icon="information-outline" size={18} iconColor="#38bdf8" style={styles.inlineIcon} />
            What Happened?
          </Text>
          <Text style={styles.bodyInstruction}>
            The mobile client attempted to load bundle or API resources from <Text style={styles.codeSpan}>localhost:8081</Text> or <Text style={styles.codeSpan}>127.0.0.1:8000</Text>, but the server rejected the connection because the service is stopped or restarting.
          </Text>

          <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 14 }]}>
            <IconButton icon="wrench-outline" size={18} iconColor="#10b981" style={styles.inlineIcon} />
            How to Fix:
          </Text>

          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Launch the mobile service directly from your terminal:
              {'\n'}
              <Text style={styles.terminalCommand}>./run_stage2_frontend_mobile</Text>
            </Text>
          </View>

          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Or launch all 3 backend & web services simultaneously:
              {'\n'}
              <Text style={styles.terminalCommand}>./start_all.sh</Text>
            </Text>
          </View>

          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              Click <Text style={{ fontWeight: 'bold', color: '#fff' }}>Retry Connection</Text> once the service starts.
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="reload"
            onPress={handleReload}
            buttonColor="#6366f1"
            style={styles.actionBtn}
          >
            Retry Connection
          </Button>

          {onContinueOffline && (
            <Button
              mode="outlined"
              icon="cellphone"
              onPress={onContinueOffline}
              textColor="#38bdf8"
              style={[styles.actionBtn, { borderColor: '#38bdf8' }]}
            >
              Continue Offline Demo
            </Button>
          )}

          {Platform.OS === 'web' && (
            <Button
              mode="text"
              icon="open-in-new"
              onPress={handleOpenWebDashboard}
              textColor="#94a3b8"
              style={styles.actionBtn}
            >
              Open Web Dashboard (Port 8080)
            </Button>
          )}
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d'
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%'
  },
  surfaceCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#121a2f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 24
  },
  iconHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 8
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  titleText: {
    color: '#f8fafc',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4
  },
  subtitleText: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 13
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  errorBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  portBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  errorLogText: {
    color: '#fca5a5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 18
  },
  targetUrlText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  diagnosticSection: {
    marginVertical: 4
  },
  sectionHeader: {
    color: '#f8fafc',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 6
  },
  inlineIcon: {
    margin: 0,
    marginRight: 4
  },
  bodyInstruction: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20
  },
  codeSpan: {
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600'
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366f1',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700'
  },
  stepText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18
  },
  terminalCommand: {
    color: '#34d399',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    marginTop: 2
  },
  actionsRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8
  },
  actionBtn: {
    borderRadius: 8
  }
});
