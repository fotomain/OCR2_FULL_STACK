import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TestFileItem } from '../../services/api';

export interface SelectedDocument {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface OCRState {
  selectedDoc: SelectedDocument | null;
  captchaPassed: boolean;
  captchaChallenge: string;
  captchaAnswer: string;
  isTraining: boolean;
  trainingMetrics: any | null;
  isRecognizing: boolean;
  recognitionResult: any | null;
  testFiles: TestFileItem[];
  isLoadingTestFiles: boolean;
  errorMessage: string | null;
}

const initialState: OCRState = {
  selectedDoc: null,
  captchaPassed: false,
  captchaChallenge: '14 + 28 = ?',
  captchaAnswer: '42',
  isTraining: false,
  trainingMetrics: null,
  isRecognizing: false,
  recognitionResult: null,
  testFiles: [],
  isLoadingTestFiles: false,
  errorMessage: null
};

export const ocrSlice = createSlice({
  name: 'ocr',
  initialState,
  reducers: {
    setSelectedDocument: (state, action: PayloadAction<SelectedDocument | null>) => {
      state.selectedDoc = action.payload;
    },
    setCaptchaChallenge: (state, action: PayloadAction<{ challenge: string; answer: string }>) => {
      state.captchaChallenge = action.payload.challenge;
      state.captchaAnswer = action.payload.answer;
      state.captchaPassed = false;
    },
    setCaptchaPassed: (state, action: PayloadAction<boolean>) => {
      state.captchaPassed = action.payload;
    },
    // Training actions
    startLearnModelRequest: (state) => {
      state.isTraining = true;
      state.errorMessage = null;
    },
    startLearnModelSuccess: (state, action: PayloadAction<any>) => {
      state.isTraining = false;
      state.trainingMetrics = action.payload;
    },
    startLearnModelFailure: (state, action: PayloadAction<string>) => {
      state.isTraining = false;
      state.errorMessage = action.payload;
    },
    // Test Files actions
    fetchTestFilesRequest: (state) => {
      state.isLoadingTestFiles = true;
    },
    fetchTestFilesSuccess: (state, action: PayloadAction<TestFileItem[]>) => {
      state.isLoadingTestFiles = false;
      state.testFiles = action.payload;
    },
    fetchTestFilesFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingTestFiles = false;
      state.errorMessage = action.payload;
    },
    // Recognition actions
    recognizeDocumentRequest: (state, action: PayloadAction<{ fileUri: string; filename: string; userEmail: string }>) => {
      state.isRecognizing = true;
      state.errorMessage = null;
    },
    recognizeDocumentSuccess: (state, action: PayloadAction<any>) => {
      state.isRecognizing = false;
      state.recognitionResult = action.payload;
    },
    recognizeDocumentFailure: (state, action: PayloadAction<string>) => {
      state.isRecognizing = false;
      state.errorMessage = action.payload;
    },
    clearRecognitionResult: (state) => {
      state.recognitionResult = null;
    }
  }
});

export const {
  setSelectedDocument,
  setCaptchaChallenge,
  setCaptchaPassed,
  startLearnModelRequest,
  startLearnModelSuccess,
  startLearnModelFailure,
  fetchTestFilesRequest,
  fetchTestFilesSuccess,
  fetchTestFilesFailure,
  recognizeDocumentRequest,
  recognizeDocumentSuccess,
  recognizeDocumentFailure,
  clearRecognitionResult
} = ocrSlice.actions;

export default ocrSlice.reducer;
