'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  timezone?: string;
  avocado: boolean;
}

interface AuthState {
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
  loading:boolean;
}

type AuthAction =
    | { type: 'AUTH_SET_USER'; payload: User }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_LOADING',payload:boolean }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, error: null,loading:false };
    case 'AUTH_LOGOUT':
      return { ...state, user: null, isAuthenticated: false, error: null ,loading:false };
    case 'AUTH_FAILURE':
      return { ...state, error: action.payload ,loading:false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case "AUTH_LOADING":

      return { ...state, error: null,loading:action.payload };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  setUser: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  currentUser?: User | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, currentUser = null }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: currentUser,
    isAuthenticated: !!currentUser,
    error: null,
    loading:false
  });

  const setUser = (user: User) => dispatch({ type: 'AUTH_SET_USER', payload: user });
  const setLoading = (loading: boolean) => dispatch({ type: 'AUTH_LOADING', payload: loading });

  const login = async (email: string, password: string) => {
    try {

      setLoading(true);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'AUTH_SET_USER', payload: data.data ,});
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: data.error?.message || 'Login failed' });
        return false;
      }
    } catch {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Network error' });
      return  false
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {

      setLoading(true);
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'AUTH_SET_USER', payload: data.data });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: data.error?.message || 'Registration failed' });
        return  false;
      }
    } catch {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Network error' });
      return  false
    }
  };

  const logout = () => dispatch({ type: 'AUTH_LOGOUT' });
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const value: AuthContextType = {
    ...state,
    login,
    register,
    setUser,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
