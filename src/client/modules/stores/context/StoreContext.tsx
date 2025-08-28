'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface Store {
  id: string;
  name: string;
  slug: string;
  address: string;
  timezone: string;
  lat: number;
  lng: number;
  currentLocalTime?: string;
  isCurrentlyOpen?: boolean;
  nextOpenTime?: string;
  distanceKm?: number;
}

interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: 'name' | 'createdAt' | 'distance';
}

type StoreAction =
  | { type: 'STORES_LOADING' }
  | { type: 'STORES_SUCCESS'; payload: Store[] }
  | { type: 'STORES_FAILURE'; payload: string }
  | { type: 'SELECT_STORE'; payload: Store }
  | { type: 'CLEAR_SELECTED_STORE' }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SORT_BY'; payload: 'name' | 'createdAt' | 'distance' }
  | { type: 'CLEAR_ERROR' };

const initialState: StoreState = {
  stores: [],
  selectedStore: null,
  loading: false,
  error: null,
  searchTerm: '',
  sortBy: 'name',
};

const storeReducer = (state: StoreState, action: StoreAction): StoreState => {
  switch (action.type) {
    case 'STORES_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'STORES_SUCCESS':
      return {
        ...state,
        stores: action.payload,
        loading: false,
        error: null,
      };
    case 'STORES_FAILURE':
      return {
        ...state,
        stores: [],
        loading: false,
        error: action.payload,
      };
    case 'SELECT_STORE':
      return {
        ...state,
        selectedStore: action.payload,
      };
    case 'CLEAR_SELECTED_STORE':
      return {
        ...state,
        selectedStore: null,
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
      };
    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface StoreContextType extends StoreState {
  loadStores: () => Promise<void>;
  selectStore: (store: Store) => void;
  clearSelectedStore: () => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'name' | 'createdAt' | 'distance') => void;
  clearError: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  const loadStores = async () => {
    dispatch({ type: 'STORES_LOADING' });
    try {
      const params = new URLSearchParams();
      if (state.searchTerm) params.append('q', state.searchTerm);
      if (state.sortBy) params.append('sort', state.sortBy);

      const response = await fetch(`/api/v1/stores?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const stores = data.data.payload || data.data.stores || [];
        dispatch({ type: 'STORES_SUCCESS', payload: stores });
      } else {
        dispatch({ type: 'STORES_FAILURE', payload: 'Failed to load stores' });
      }
    } catch (error) {
      dispatch({ type: 'STORES_FAILURE', payload: 'Network error' });
    }
  };

  const selectStore = (store: Store) => {
    dispatch({ type: 'SELECT_STORE', payload: store });
  };

  const clearSelectedStore = () => {
    dispatch({ type: 'CLEAR_SELECTED_STORE' });
  };

  const setSearchTerm = (term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setSortBy = (sortBy: 'name' | 'createdAt' | 'distance') => {
    dispatch({ type: 'SET_SORT_BY', payload: sortBy });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  useEffect(() => {
    loadStores();
  }, [state.searchTerm, state.sortBy]);

  const value: StoreContextType = {
    ...state,
    loadStores,
    selectStore,
    clearSelectedStore,
    setSearchTerm,
    setSortBy,
    clearError,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
