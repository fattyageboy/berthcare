// Visit slice - visit state management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Visit } from '../../types';

interface VisitState {
  visits: Visit[];
  currentVisit: Visit | null;
  isLoading: boolean;
}

const initialState: VisitState = {
  visits: [],
  currentVisit: null,
  isLoading: false,
};

const visitSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setVisits: (state, action: PayloadAction<Visit[]>) => {
      state.visits = action.payload;
    },
    setCurrentVisit: (state, action: PayloadAction<Visit | null>) => {
      state.currentVisit = action.payload;
    },
    updateVisit: (state, action: PayloadAction<Visit>) => {
      const index = state.visits.findIndex((v: Visit) => v.id === action.payload.id);
      if (index !== -1) {
        state.visits[index] = action.payload;
      }
      if (state.currentVisit?.id === action.payload.id) {
        state.currentVisit = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setVisits, setCurrentVisit, updateVisit, setLoading } = visitSlice.actions;
export default visitSlice.reducer;
