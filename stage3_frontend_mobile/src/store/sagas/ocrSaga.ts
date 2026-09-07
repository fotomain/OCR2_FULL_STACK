import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  startLearnModelRequest,
  startLearnModelSuccess,
  startLearnModelFailure,
  fetchTestFilesRequest,
  fetchTestFilesSuccess,
  fetchTestFilesFailure,
  recognizeDocumentRequest,
  recognizeDocumentSuccess,
  recognizeDocumentFailure
} from '../slices/ocrSlice';
import { addScan } from '../slices/historySlice';
import { apiService, TestFileItem } from '../../services/api';
import { sqliteService } from '../../services/sqlite_db';

function* handleStartLearnModel(): Generator<any, void, any> {
  try {
    const result = yield call([apiService, apiService.trainModel]);
    yield put(startLearnModelSuccess(result));
  } catch (error: any) {
    yield put(startLearnModelFailure(error.message || 'Model learning failed'));
  }
}

function* handleFetchTestFiles(): Generator<any, void, any> {
  try {
    const files: TestFileItem[] = yield call([apiService, apiService.getTestFiles]);
    yield put(fetchTestFilesSuccess(files));
  } catch (error: any) {
    yield put(fetchTestFilesFailure(error.message || 'Failed to fetch test files'));
  }
}

function* handleRecognizeDocument(
  action: PayloadAction<{ fileUri: string; filename: string; userEmail: string }>
): Generator<any, void, any> {
  try {
    const { fileUri, filename, userEmail } = action.payload;
    const result = yield call([apiService, apiService.recognizeDocument], fileUri, filename, userEmail);
    yield put(recognizeDocumentSuccess(result));

    // Save to SQLite database
    const entities = result.entities || {};
    const savedRecord = yield call([sqliteService, sqliteService.saveScanRecord], {
      user_email: userEmail,
      filename: filename,
      document_type: entities.document_type || 'UNKNOWN',
      confidence: entities.document_type_confidence || 0.0,
      total_amount: entities.total_amount,
      currency: entities.currency || 'USD',
      raw_json: JSON.stringify(result)
    });

    yield put(addScan(savedRecord));
  } catch (error: any) {
    yield put(recognizeDocumentFailure(error.message || 'Recognition execution failed'));
  }
}

export function* ocrSaga() {
  yield takeLatest(startLearnModelRequest.type, handleStartLearnModel);
  yield takeLatest(fetchTestFilesRequest.type, handleFetchTestFiles);
  yield takeLatest(recognizeDocumentRequest.type, handleRecognizeDocument);
}
