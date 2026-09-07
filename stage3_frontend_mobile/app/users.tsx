import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Surface, Avatar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setCurrentUser, setAllUsers } from '@/store/slices/authSlice';
import { sqliteService, UserAccount } from '@/services/sqlite_db';

export default function UsersScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme() as any;
  const themeMode = useSelector((state: RootState) => state.theme?.themeMode || 'light');
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const allUsers = useSelector((state: RootState) => state.auth.allUsers);

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('Executive Analyst');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const users = await sqliteService.getAllUsers();
    dispatch(setAllUsers(users));
  };

  const handleCreateUser = async () => {
    if (!emailInput.trim() || !nameInput.trim()) return;
    const created = await sqliteService.addUser(emailInput.trim(), nameInput.trim(), roleInput);
    setEmailInput('');
    setNameInput('');
    await loadUsers();
    dispatch(setCurrentUser(created));
  };

  const handleSelectUser = (user: any) => {
    dispatch(setCurrentUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.auth_provider || user.provider || 'sqlite'
    }));
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Create New User Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
        <Card.Title
          title="Add Multi-Tenant User"
          subtitle="Persisted in Expo SQLite Database"
          titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
          subtitleStyle={{ color: theme.colors.textDim }}
        />
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Full Name"
            value={nameInput}
            onChangeText={setNameInput}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            textColor={theme.colors.textMain}
          />
          <TextInput
            mode="outlined"
            label="Email Address"
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            textColor={theme.colors.textMain}
          />
          <Button
            mode="contained"
            icon="account-plus"
            onPress={handleCreateUser}
            style={[styles.btnAdd, { backgroundColor: theme.colors.primary }]}
          >
            Create User Account
          </Button>
        </Card.Content>
      </Card>

      <Text variant="titleSmall" style={[styles.listTitle, { color: theme.colors.textMuted }]}>
        Registered SQLite Accounts ({allUsers.length})
      </Text>

      <FlatList
        data={allUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = item.email === currentUser.email;
          return (
            <Card
              style={[
                styles.userCard,
                { backgroundColor: theme.colors.cardBg, borderColor: isSelected ? theme.colors.primary : theme.colors.cardBorder },
                isSelected && { borderWidth: 1.5 }
              ]}
              onPress={() => handleSelectUser(item)}
            >
              <Card.Title
                title={item.name}
                subtitle={`${item.email} • ${item.role}`}
                titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
                subtitleStyle={{ color: theme.colors.textDim }}
                left={(props) => (
                  <Avatar.Text
                    size={36}
                    label={item.name.substring(0, 2).toUpperCase()}
                    style={{ backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }}
                    color={isSelected ? '#ffffff' : theme.colors.textMain}
                  />
                )}
                right={(props) =>
                  isSelected ? (
                    <IconButton {...props} icon="check-circle" iconColor={theme.colors.primary} />
                  ) : null
                }
              />
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1
  },
  input: {
    marginBottom: 10
  },
  btnAdd: {
    marginTop: 8,
    borderRadius: 8
  },
  listTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12
  },
  userCard: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1
  }
});
