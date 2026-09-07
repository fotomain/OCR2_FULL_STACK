import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Text, TextInput, IconButton, Surface, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Props {
  passed: boolean;
  onVerify: (passed: boolean) => void;
}

export const LocalCaptcha: React.FC<Props> = ({ passed, onVerify }) => {
  const theme = useTheme() as any;
  const themeMode = useSelector((state: RootState) => state.theme?.themeMode || 'light');

  const [challenge, setChallenge] = useState('24 + 18 = ?');
  const [expectedAnswer, setExpectedAnswer] = useState('42');
  const [userInput, setUserInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('Solve the math challenge to enable recognition.');

  const generateNewChallenge = () => {
    const ops = ['+', '-', 'x'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1 = 10, n2 = 5, ans = 15, text = '';
    if (op === '+') {
      n1 = Math.floor(Math.random() * 40) + 10;
      n2 = Math.floor(Math.random() * 30) + 5;
      ans = n1 + n2;
      text = `${n1} + ${n2} = ?`;
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * 50) + 30;
      n2 = Math.floor(Math.random() * 20) + 5;
      ans = n1 - n2;
      text = `${n1} - ${n2} = ?`;
    } else {
      n1 = Math.floor(Math.random() * 8) + 2;
      n2 = Math.floor(Math.random() * 8) + 2;
      ans = n1 * n2;
      text = `${n1} x ${n2} = ?`;
    }
    setChallenge(text);
    setExpectedAnswer(String(ans));
    setUserInput('');
    setStatusMsg('Solve the math challenge to enable recognition.');
    onVerify(false);
  };

  useEffect(() => {
    generateNewChallenge();
  }, []);

  const handleInputChange = (val: string) => {
    setUserInput(val);
    if (val.trim() === expectedAnswer) {
      setStatusMsg('✓ Security challenge passed!');
      onVerify(true);
    } else {
      if (val.trim().length >= expectedAnswer.length) {
        setStatusMsg('✗ Incorrect answer. Try again or refresh.');
      } else {
        setStatusMsg('Solve the math challenge to enable recognition.');
      }
      onVerify(false);
    }
  };

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.cardInnerBg || '#f8fafc',
          borderColor: theme.colors.outline || '#e2e8f0'
        }
      ]}
      elevation={1}
    >
      <View style={styles.header}>
        <Text variant="labelSmall" style={[styles.headerTitle, { color: theme.colors.textMuted }]}>
          SECURITY VERIFICATION (CAPTCHA)
        </Text>
        <IconButton
          icon="refresh"
          size={18}
          iconColor={theme.colors.primary}
          onPress={generateNewChallenge}
        />
      </View>

      <View style={styles.bodyRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: themeMode === 'dark' ? '#1e1b4b' : '#eef2ff',
              borderColor: theme.colors.primary
            }
          ]}
        >
          <Text style={[styles.challengeText, { color: theme.colors.primary }]}>{challenge}</Text>
        </View>

        <TextInput
          mode="outlined"
          placeholder="Answer"
          placeholderTextColor={theme.colors.textDim}
          value={userInput}
          onChangeText={handleInputChange}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          textColor={theme.colors.textMain}
          dense
        />
      </View>

      <Text
        style={[
          styles.statusText,
          { color: passed ? '#059669' : theme.colors.textDim },
          passed && styles.statusSuccess
        ]}
      >
        {statusMsg}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  headerTitle: {
    fontWeight: '600'
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1
  },
  challengeText: {
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  input: {
    flex: 1,
    height: 42
  },
  statusText: {
    fontSize: 11,
    marginTop: 6
  },
  statusSuccess: {
    fontWeight: '600'
  }
});
