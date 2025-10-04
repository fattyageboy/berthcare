// Sync slice - synchronization state management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState } from '../../types';

const initialState: SyncState = {
  lastSyncedAt: '',
  pendingChanges: 0,
  isSyncing: false,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncState: (state, action: PayloadAction<Partial<SyncState>>) => {
      return { ...state, ...action.payload };
    },
    startSync: state => {
      state.isSyncing = true;
    },
    completeSync: (state, action: PayloadAction<string>) => {
      state.isSyncing = false;
      state.lastSyncedAt = action.payload;
      state.pendingChanges = 0;
    },
    incrementPendingChanges: state => {
      state.pendingChanges += 1;
    },
  },
});

export const { setSyncState, startSync, completeSync, incrementPendingChanges } = syncSlice.actions;
export default syncSlice.reducer;
