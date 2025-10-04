// Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import visitReducer from './slices/visitSlice';
import syncReducer from './slices/syncSlice';
import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    visits: visitReducer,
    sync: syncReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(baseApi.middleware),
});

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
