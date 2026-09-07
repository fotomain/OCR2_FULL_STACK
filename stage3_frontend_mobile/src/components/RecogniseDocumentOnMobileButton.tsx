import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { recognizeDocumentRequest } from '../store/slices/ocrSlice';

interface Props {
  captchaPassed: boolean;
}

export const RecogniseDocumentOnMobileButton: React.FC<Props> = ({ captchaPassed }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme() as any;

  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const selectedDoc = useSelector((state: RootState) => state.ocr.selectedDoc);
  const isRecognizing = useSelector((state: RootState) => state.ocr.isRecognizing);

  const isReady = Boolean(selectedDoc && captchaPassed && !isRecognizing);

  const handleRecognize = () => {
    if (!selectedDoc || !captchaPassed) return;
    dispatch(
      recognizeDocumentRequest({
        fileUri: selectedDoc.uri,
        filename: selectedDoc.name,
        userEmail: currentUser.email
      })
    );
  };

  return (
    <Button
      mode="contained"
      icon="text-recognition"
      loading={isRecognizing}
      disabled={!isReady}
      onPress={handleRecognize}
      style={[
        styles.recognizeBtn,
        isReady
          ? { backgroundColor: '#059669', elevation: 3 }
          : { backgroundColor: theme.colors.surfaceVariant, opacity: 0.6 }
      ]}
      contentStyle={styles.btnContent}
      labelStyle={[
        styles.btnLabel,
        { color: isReady ? '#ffffff' : theme.colors.textDim }
      ]}
    >
      RecogniseDocumentOnMobileButton
    </Button>
  );
};

const styles = StyleSheet.create({
  recognizeBtn: {
    borderRadius: 10,
    marginTop: 6
  },
  btnContent: {
    height: 50
  },
  btnLabel: {
    fontWeight: 'bold',
    fontSize: 14
  }
});
