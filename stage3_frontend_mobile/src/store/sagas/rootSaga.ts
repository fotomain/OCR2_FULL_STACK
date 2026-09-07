import { all, fork } from 'redux-saga/effects';
import { ocrSaga } from './ocrSaga';

export function* rootSaga() {
  yield all([
    fork(ocrSaga)
  ]);
}
