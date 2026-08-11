import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import jobsReducer from './jobsSlice.js';
import notificationsReducer from './notificationsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
