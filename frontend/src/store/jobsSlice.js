import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api.js';

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchFeedJobs = createAsyncThunk(
  'jobs/fetchFeedJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs/feed');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch job feed.');
    }
  }
);

export const fetchAllJobs = createAsyncThunk(
  'jobs/fetchAllJobs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.company_type) params.append('company_type', filters.company_type);
      if (filters.job_type) params.append('job_type', filters.job_type);
      if (filters.experience_level) params.append('experience_level', filters.experience_level);
      if (filters.min_salary) params.append('min_salary', filters.min_salary);
      if (filters.max_salary) params.append('max_salary', filters.max_salary);
      if (filters.skills) params.append('skills', filters.skills.join(','));
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      const response = await api.get(`/jobs/?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch jobs.');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch job details.');
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'jobs/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/recommendations/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch recommendations.');
    }
  }
);

export const fetchTrending = createAsyncThunk(
  'jobs/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/recommendations/trending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch trending jobs.');
    }
  }
);

// ─── Initial State ──────────────────────────────────────────────────────────────

const initialState = {
  feedJobs: [],
  allJobs: [],
  recommendations: [],
  trending: [],
  selectedJob: null,
  currentJobIndex: 0,
  filters: {
    search: '',
    company_type: '',
    job_type: '',
    experience_level: '',
    min_salary: null,
    max_salary: null,
    skills: [],
    page: 1,
    limit: 12,
  },
  totalJobs: 0,
  isLoading: false,
  isFeedLoading: false,
  isRecsLoading: false,
  error: null,
};

// ─── Slice ──────────────────────────────────────────────────────────────────────

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setCurrentJobIndex: (state, action) => {
      state.currentJobIndex = action.payload;
    },
    incrementJobIndex: (state) => {
      state.currentJobIndex += 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedJob: (state, action) => {
      state.selectedJob = action.payload;
    },
    addJobToFeed: (state, action) => {
      state.feedJobs.push(action.payload);
    },
    resetFeed: (state) => {
      state.feedJobs = [];
      state.currentJobIndex = 0;
    },
  },
  extraReducers: (builder) => {
    // Feed Jobs
    builder
      .addCase(fetchFeedJobs.pending, (state) => {
        state.isFeedLoading = true;
        state.error = null;
      })
      .addCase(fetchFeedJobs.fulfilled, (state, action) => {
        state.isFeedLoading = false;
        state.feedJobs = action.payload;
        state.currentJobIndex = 0;
      })
      .addCase(fetchFeedJobs.rejected, (state, action) => {
        state.isFeedLoading = false;
        state.error = action.payload;
      });

    // All Jobs
    builder
      .addCase(fetchAllJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(action.payload)) {
          state.allJobs = action.payload;
          state.totalJobs = action.payload.length;
        } else {
          state.allJobs = action.payload.jobs || action.payload.items || [];
          state.totalJobs = action.payload.total || 0;
        }
      })
      .addCase(fetchAllJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Job By Id
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Recommendations
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.isRecsLoading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.isRecsLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.isRecsLoading = false;
        state.error = action.payload;
      });

    // Trending
    builder
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload;
      });
  },
});

export const {
  setCurrentJobIndex,
  incrementJobIndex,
  setFilters,
  clearFilters,
  setSelectedJob,
  addJobToFeed,
  resetFeed,
} = jobsSlice.actions;

export default jobsSlice.reducer;
