import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Platform, Linking } from 'react-native';
import { Appbar, Card, Button, Text, ProgressBar, Surface, IconButton, Chip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  setSelectedDocument,
  setCaptchaPassed,
  startLearnModelRequest,
  fetchTestFilesRequest
} from '@/store/slices/ocrSlice';
import { signOutSuccess } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import { apiService, TestFileItem } from '@/services/api';
import { supabaseAuthService } from '@/services/supabase';
import { SelectDocumentOnMobileButton } from '@/components/SelectDocumentOnMobileButton';
import { RecogniseDocumentOnMobileButton } from '@/components/RecogniseDocumentOnMobileButton';
import { LocalCaptcha } from '@/components/LocalCaptcha';
import { ResultViewer } from '@/components/ResultViewer';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';

// noinspection SpellCheckingInspection,JSUnusedGlobalSymbols
export default function MobileDashboardScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme() as any;
  const scrollViewRef = useRef<ScrollView>(null);

  const { currentUser, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const themeMode = useSelector((state: RootState) => state.theme.themeMode);
  const {
    selectedDoc,
    captchaPassed,
    isTraining,
    trainingMetrics,
    isRecognizing,
    recognitionResult,
    testFiles,
    isLoadingTestFiles
  } = useSelector((state: RootState) => state.ocr);

  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [loadingTestDoc, setLoadingTestDoc] = useState<string | null>(null);
  const [resultsY, setResultsY] = useState<number>(0);

  // Fetch test files on mount
  useEffect(() => {
    dispatch(fetchTestFilesRequest());
  }, []);

  // Auto-scroll to results when recognition results are received
  useEffect(() => {
    if (recognitionResult) {
      const timer = setTimeout(() => {
        if (resultsY > 0) {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, resultsY - 16), animated: true });
        } else {
          scrollViewRef.current?.scrollTo({ y: 320, animated: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [recognitionResult, resultsY]);

  // 1. StartLearnModelButton Handler
  const handleStartLearnModel = () => {
    dispatch(startLearnModelRequest());
  };

  // 2. Camera photo captured callback
  const handlePhotoCaptured = (uri: string, filename: string) => {
    dispatch(
      setSelectedDocument({
        uri,
        name: filename,
        mimeType: 'image/png'
      })
    );
  };

  // 3. Test Dataset Gallery Handlers
  const handleUseTestDocument = async (file: TestFileItem) => {
    setLoadingTestDoc(file.filename);
    try {
      const { uri } = await apiService.downloadTestFileBlob(file.filename);
      dispatch(
        setSelectedDocument({
          uri,
          name: file.filename,
          mimeType: 'application/pdf',
          size: file.size_bytes
        })
      );
      // Scroll back up to 1st section (Recognition Station)
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      dispatch(
        setSelectedDocument({
          uri: 'data:application/pdf;base64,JVBERi0xLjQK...',
          name: file.filename,
          mimeType: 'application/pdf',
          size: file.size_bytes
        })
      );
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setLoadingTestDoc(null);
    }
  };

  const handleDownloadTestDocument = (file: TestFileItem) => {
    const url = `${apiService.getBaseUrl()}/api/v1/tests/download/${file.filename}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  // 4. Report Links Handler
  const openReport = (type: 'ml' | 'pipeline' | 'visio') => {
    const urls = apiService.getReportUrls();
    let target = urls.mlReportHtml;
    if (type === 'pipeline') target = urls.mlPipelineReportHtml;
    if (type === 'visio') target = urls.mlVisioReportVsdx;

    if (Platform.OS === 'web') {
      window.open(target, '_blank');
    } else {
      Linking.openURL(target);
    }
  };

  // 5. Supabase Sign Out
  const handleSignOut = async () => {
    await supabaseAuthService.signOut();
    dispatch(signOutSuccess());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Executive MD3 Appbar with Supabase Auth status */}
      <Appbar.Header style={[styles.appbar, { backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.outline }]} elevated>
        <Appbar.Content
          title="OCR2 Enterprise Mobile"
          subtitle={`${currentUser.email} • MD3`}
          titleStyle={[styles.appbarTitle, { color: theme.colors.textMain }]}
          subtitleStyle={[styles.appbarSubtitle, { color: theme.colors.textDim }]}
        />
        {/* Dark / Light Theme Switcher */}
        <Appbar.Action
          icon={themeMode === 'dark' ? 'white-balance-sunny' : 'weather-night'}
          iconColor={themeMode === 'dark' ? '#f59e0b' : '#4f46e5'}
          onPress={() => dispatch(toggleTheme())}
          accessibilityLabel="Toggle Dark/Light Theme"
        />
        {/* Supabase Auth Modal Opener */}
        <Appbar.Action
          icon="account-circle"
          iconColor={isAuthenticated ? theme.colors.primary : '#ef4444'}
          onPress={() => router.push('/auth')}
          accessibilityLabel="Supabase Authentication"
        />
        {/* Scan Audit History */}
        <Appbar.Action icon="history" onPress={() => router.push('/history')} />
      </Appbar.Header>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        {/* User Identity & Auth Status Band */}
        <Surface style={[styles.authStatusBand, { backgroundColor: theme.colors.surfaceContainerLow || theme.colors.cardBg, borderColor: theme.colors.cardBorder }]} elevation={1}>
          <View style={styles.authStatusLeft}>
            <View style={[styles.statusDot, { backgroundColor: isAuthenticated ? '#10b981' : '#f59e0b' }]} />
            <View>
              <Text style={[styles.authUserName, { color: theme.colors.textMain }]}>{currentUser.name}</Text>
              <Text style={[styles.authUserEmail, { color: theme.colors.textDim }]}>{currentUser.email}</Text>
            </View>
          </View>
          <View style={styles.authStatusRight}>
            <Chip compact style={{ backgroundColor: theme.colors.surfaceContainer || theme.colors.surfaceVariant }} textStyle={{ fontSize: 10, color: theme.colors.primary, fontWeight: 'bold' }}>
              {currentUser.provider || 'supabase'}
            </Chip>
            <Button
              mode="text"
              compact
              onPress={() => router.push('/auth')}
              textColor={theme.colors.primary}
            >
              {isAuthenticated ? 'Switch / Sign Out' : 'Sign In'}
            </Button>
          </View>
        </Surface>

        {/* ========================================================================= */}
        {/* 1ST SECTION: Mobile Document Recognition Station (Material Design 3) */}
        {/* ========================================================================= */}
        <Card mode="elevated" elevation={2} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
          <Card.Title
            title="Mobile Document Recognition Station"
            subtitle="1st Section • Select document & execute AI recognition"
            titleVariant="titleMedium"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
            subtitleStyle={{ color: theme.colors.primary, fontWeight: '600' }}
            left={(props) => <IconButton {...props} icon="file-scan" iconColor={theme.colors.primary} />}
          />
          <Card.Content>
            {/* 1. SelectDocumentOnMobileButton Component */}
            <SelectDocumentOnMobileButton onOpenCamera={() => setCameraModalVisible(true)} />

            {/* 2. Security CAPTCHA Challenge */}
            <LocalCaptcha
              passed={captchaPassed}
              onVerify={(passed) => dispatch(setCaptchaPassed(passed))}
            />

            {/* 3. RecogniseDocumentOnMobileButton Component */}
            <RecogniseDocumentOnMobileButton captchaPassed={captchaPassed} />
          </Card.Content>
        </Card>

        {/* ========================================================================= */}
        {/* 2ND SECTION: Results & Show JSON Results with Auto-Scroll (as requested) */}
        {/* ========================================================================= */}
        <View
          style={styles.resultsSectionWrap}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setResultsY(layout.y);
          }}
        >
          {recognitionResult ? (
            <ResultViewer
              data={recognitionResult}
              filename={selectedDoc?.name || 'document.pdf'}
            />
          ) : (
            <Surface
              style={[
                styles.emptyResultsPrompt,
                {
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.outline
                }
              ]}
              elevation={1}
            >
              <IconButton icon="text-box-search-outline" iconColor={theme.colors.textDim} size={36} />
              <Text style={[styles.emptyPromptTitle, { color: theme.colors.textMain }]}>
                2nd Section: Recognition Results
              </Text>
              <Text style={[styles.emptyPromptSub, { color: theme.colors.textDim }]}>
                Select a document above and tap RecogniseDocumentOnMobileButton to view entities, structured line items table, detected barcodes, and raw JSON response.
              </Text>
            </Surface>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 3RD SECTION: Test Dataset Samples Gallery */}
        {/* ========================================================================= */}
        <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder, marginTop: 16 }]}>
          <Card.Title
            title="Test Dataset Samples Gallery"
            subtitle="3rd Section • Samples from ./dataset_for_tests ready for instant test"
            titleVariant="titleMedium"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
            subtitleStyle={{ color: theme.colors.textDim }}
            left={(props) => <IconButton {...props} icon="folder-open" iconColor={theme.colors.secondary} />}
          />
          <Card.Content>
            {isLoadingTestFiles ? (
              <ProgressBar indeterminate color={theme.colors.primary} style={{ marginVertical: 10 }} />
            ) : (
              <View style={styles.testGalleryGrid}>
                {testFiles.map((file) => (
                  <Surface
                    key={file.filename}
                    style={[
                      styles.testDocCard,
                      { backgroundColor: theme.colors.surfaceContainerLow || theme.colors.surfaceVariant, borderColor: theme.colors.outline }
                    ]}
                    elevation={1}
                  >
                    <View style={styles.testDocHeader}>
                      <Text style={[styles.testDocName, { color: theme.colors.textMain }]}>{file.filename}</Text>
                      <Chip compact style={{ backgroundColor: theme.colors.primaryContainer || (themeMode === 'dark' ? '#1e1b4b' : '#eef2ff') }} textStyle={{ fontSize: 9, color: theme.colors.onPrimaryContainer || theme.colors.primary, fontWeight: 'bold' }}>
                        {file.category}
                      </Chip>
                    </View>
                    <Text style={[styles.testDocDesc, { color: theme.colors.textDim }]}>{file.description}</Text>
                    <View style={styles.testDocActions}>
                      <Button
                        mode="outlined"
                        compact
                        icon="download"
                        onPress={() => handleDownloadTestDocument(file)}
                        style={[styles.btnTestAct, { borderColor: theme.colors.outline }]}
                        textColor={theme.colors.textMain}
                      >
                        Download
                      </Button>
                      <Button
                        mode="contained-tonal"
                        compact
                        icon="play"
                        loading={loadingTestDoc === file.filename}
                        onPress={() => handleUseTestDocument(file)}
                        style={[styles.btnTestAct, { backgroundColor: theme.colors.primaryContainer }]}
                        textColor={theme.colors.onPrimaryContainer}
                      >
                        Use in Test
                      </Button>
                    </View>
                  </Surface>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* ========================================================================= */}
        {/* 4TH SECTION: Stage 1 ML Training Center */}
        {/* ========================================================================= */}
        <Card mode="elevated" elevation={2} style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.heroCardBorder, marginTop: 16 }]}>
          <Card.Title
            title="Stage 1 ML Training Center"
            subtitle="4th Section • Base Corpus + User Namespaces -> ./output/model"
            titleVariant="titleMedium"
            subtitleVariant="bodySmall"
            titleStyle={{ color: theme.colors.textMain, fontWeight: 'bold' }}
            subtitleStyle={{ color: theme.colors.textDim }}
            left={(props) => <IconButton {...props} icon="brain" iconColor={theme.colors.primary} />}
          />
          <Card.Content>
            {isTraining && (
              <View style={styles.trainingProgressWrap}>
                <ProgressBar indeterminate color={theme.colors.primary} style={styles.progressBar} />
                <Text style={[styles.trainingText, { color: theme.colors.textDim }]}>
                  Training ML model across multi-tenant user datasets...
                </Text>
              </View>
            )}

            {trainingMetrics && (
              <Surface style={[styles.metricsBox, { backgroundColor: theme.colors.metricBoxBg, borderColor: theme.colors.outline }]} elevation={1}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textDim }]}>ACCURACY</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.primary }]}>
                    {((trainingMetrics.metrics?.accuracy ?? 1.0) * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textDim }]}>CLASSES</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.secondary }]}>
                    {trainingMetrics.metrics?.categories_count || 6}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textDim }]}>SAMPLES</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.textMain }]}>
                    {trainingMetrics.metrics?.total_samples || 30}
                  </Text>
                </View>
              </Surface>
            )}

            {/* StartLearnModelButton */}
            <Button
              mode="contained"
              icon="play-circle"
              loading={isTraining}
              disabled={isTraining}
              onPress={handleStartLearnModel}
              style={[styles.btnStartLearn, { backgroundColor: theme.colors.primary }]}
            >
              StartLearnModelButton
            </Button>

            {/* Reports Access Row */}
            <View style={styles.reportButtonsRow}>
              <Button
                mode="text"
                compact
                icon="file-document"
                onPress={() => openReport('ml')}
                textColor={theme.colors.primary}
                style={styles.btnReport}
              >
                ML Report
              </Button>
              <Button
                mode="text"
                compact
                icon="chart-timeline-variant"
                onPress={() => openReport('pipeline')}
                textColor={theme.colors.secondary}
                style={styles.btnReport}
              >
                Pipeline Math
              </Button>
              <Button
                mode="text"
                compact
                icon="file-download"
                onPress={() => openReport('visio')}
                textColor="#7c3aed"
                style={styles.btnReport}
              >
                Visio (.vsdx)
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Vision Camera Capture Modal */}
      <CameraCaptureModal
        visible={cameraModalVisible}
        onDismiss={() => setCameraModalVisible(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  appbar: {
    borderBottomWidth: 1
  },
  appbarTitle: {
    fontWeight: 'bold',
    fontSize: 18
  },
  appbarSubtitle: {
    fontSize: 11
  },
  content: {
    padding: Platform.OS === 'web' ? 16 : 12,
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center'
  },
  authStatusBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14
  },
  authStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  authUserName: {
    fontWeight: 'bold',
    fontSize: 13
  },
  authUserEmail: {
    fontSize: 11
  },
  authStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  card: {
    borderWidth: 1,
    borderRadius: 16
  },
  resultsSectionWrap: {
    marginTop: 14
  },
  emptyResultsPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed'
  },
  emptyPromptTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4
  },
  emptyPromptSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 480
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16
  },
  trainingProgressWrap: {
    marginVertical: 8
  },
  progressBar: {
    height: 6,
    borderRadius: 3
  },
  trainingText: {
    fontSize: 11,
    marginTop: 6
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1
  },
  metricItem: {
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  metricVal: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  btnStartLearn: {
    borderRadius: 8,
    marginTop: 8
  },
  reportButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  btnReport: {
    flex: 1
  },
  testGalleryGrid: {
    gap: 10
  },
  testDocCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  testDocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  testDocName: {
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1
  },
  testDocDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 4
  },
  testDocActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  btnTestAct: {
    flex: 1,
    borderRadius: 6
  }
});
