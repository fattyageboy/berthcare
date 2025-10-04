// Visit API endpoints
import { baseApi } from './baseApi';
import type { Visit, ApiResponse } from '../../types';

interface GetVisitsParams {
  date?: string;
  status?: Visit['status'];
}

interface CheckInRequest {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface UpdateDocumentationRequest {
  vitalSigns?: Record<string, any>;
  assessment?: string;
  careActivities?: string[];
  patientResponse?: string;
  notes?: string;
}

interface CompleteVisitRequest {
  signature: string;
  completedAt: string;
}

export const visitApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getVisits: builder.query<ApiResponse<Visit[]>, GetVisitsParams | void>({
      query: (params = {}) => ({
        url: '/visits',
        params: params || {},
      }),
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Visit' as const, id })),
              { type: 'Visit', id: 'LIST' },
            ]
          : [{ type: 'Visit', id: 'LIST' }],
    }),
    getVisitById: builder.query<ApiResponse<Visit>, string>({
      query: id => `/visits/${id}`,
      providesTags: (result, error, id) => [{ type: 'Visit', id }],
    }),
    checkIn: builder.mutation<ApiResponse<Visit>, { id: string; data: CheckInRequest }>({
      query: ({ id, data }) => ({
        url: `/visits/${id}/check-in`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Visit', id }],
    }),
    updateDocumentation: builder.mutation<
      ApiResponse<Visit>,
      { id: string; data: UpdateDocumentationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/visits/${id}/documentation`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Visit', id }],
      // Optimistic update
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          visitApi.util.updateQueryData('getVisitById', id, draft => {
            Object.assign(draft.data, data);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    completeVisit: builder.mutation<ApiResponse<Visit>, { id: string; data: CompleteVisitRequest }>(
      {
        query: ({ id, data }) => ({
          url: `/visits/${id}/complete`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: 'Visit', id },
          { type: 'Visit', id: 'LIST' },
        ],
      },
    ),
  }),
});

export const {
  useGetVisitsQuery,
  useGetVisitByIdQuery,
  useCheckInMutation,
  useUpdateDocumentationMutation,
  useCompleteVisitMutation,
} = visitApi;
