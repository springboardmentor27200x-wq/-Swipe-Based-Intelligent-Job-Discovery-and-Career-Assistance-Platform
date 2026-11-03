import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
let user = null;
try {
  user = userStr ? JSON.parse(userStr) : null;
} catch (e) {
  localStorage.removeItem('user');
}

const initialState = {
  user: user,
  token: token,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, access, access_token, refresh, refresh_token } = action.payload;
const finalToken = access || access_token;
const finalRefresh = refresh || refresh_token;
      state.user = user;
      state.token = finalToken;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('token', finalToken);
      if (finalRefresh) {
  localStorage.setItem('refresh_token', finalRefresh);
}
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  },
});

export const { setCredentials, clearCredentials, setLoading, setError, updateUser } = authSlice.actions;

export default authSlice.reducer;
