import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text, Card, Chip, IconButton, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';
import { sqliteService, ScanRecord } from '../src/services/sqlite_db';

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme() as any;
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const themeMode = useSelector((state: RootState) => state.theme?.themeMode || 'light');
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    loadUserScans();
  }, [currentUser.email]);

  const loadUserScans = async () => {
    const records = await sqliteService.getScansForUser(currentUser.email);
    setScans(records);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.textMain }]}>
          Audit History: {currentUser.email}
        </Text>
        <IconButton icon="refresh" size={20} iconColor={theme.colors.primary} onPress={loadUserScans} />
      </View>

      {scans.length === 0 ? (
        <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]} elevation={1}>
          <IconButton icon="file-document-outline" size={40} iconColor={theme.colors.textDim} />
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            No document scan history for this account.
          </Text>
        </Surface>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={[styles.scanCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
              <Card.Title
                title={item.filename}
                subtitle={`${new Date(item.created_at).toLocaleDateString()} • ${(item.confidence * 100).toFixed(1)}% Conf`}
                titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
                subtitleStyle={{ color: theme.colors.textDim }}
                left={(props) => <IconButton {...props} icon="file-check" iconColor="#10b981" />}
                right={(props) => (
                  <Chip compact style={[styles.typeChip, { backgroundColor: themeMode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe' }]} textStyle={{ fontSize: 10, color: theme.colors.secondary, fontWeight: 'bold' }}>
                    {item.document_type}
                  </Chip>
                )}
              />
              <Card.Content>
                {item.total_amount && (
                  <Text style={[styles.totalText, { color: '#10b981' }]}>
                    Total Extracted: {item.currency} ${item.total_amount.toFixed(2)}
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontWeight: 'bold'
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1
  },
  emptyText: {
    marginTop: 8
  },
  scanCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  typeChip: {
    marginRight: 12
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 13
  }
});
