// RTK Query base API configuration
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootState } from '../index';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.berthcare.ca';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers, { getState }) => {
      // Get token from Redux state or AsyncStorage
      const token =
        (getState() as RootState).auth.accessToken || (await AsyncStorage.getItem('access_token'));

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Visit', 'User', 'Client', 'Sync'],
  endpoints: () => ({}),
});
