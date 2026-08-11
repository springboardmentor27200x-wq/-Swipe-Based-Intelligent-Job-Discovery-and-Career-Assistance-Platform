import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { logout, updateUser } from '../store/authSlice.js';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(s => s.auth);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleUpdateUser = useCallback((data) => {
    dispatch(updateUser(data));
  }, [dispatch]);

  const isAdmin = user?.role === 'admin';
  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';
  const isJobSeeker = user?.role === 'job_seeker';

  const getInitials = useCallback((name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isRecruiter,
    isJobSeeker,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    getInitials,
  };
}

export default useAuth;
