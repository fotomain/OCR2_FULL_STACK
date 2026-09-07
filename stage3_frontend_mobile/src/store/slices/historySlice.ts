import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScanRecord } from '../../services/sqlite_db';

interface HistoryState {
  scans: ScanRecord[];
  isLoading: boolean;
}

const initialState: HistoryState = {
  scans: [],
  isLoading: false
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setScans: (state, action: PayloadAction<ScanRecord[]>) => {
      state.scans = action.payload;
    },
    addScan: (state, action: PayloadAction<ScanRecord>) => {
      state.scans.unshift(action.payload);
    }
  }
});

export const { setScans, addScan } = historySlice.actions;
export default historySlice.reducer;
