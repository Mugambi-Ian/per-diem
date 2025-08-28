'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthContext } from '@/client/modules/auth/context/AuthContext';

interface Store {
  id: string;
  name: string;
  slug: string;
  address: string;
  timezone: string;
  lat: number;
  lng: number;
  isCurrentlyOpen?: boolean;
  nextOpenTime?: string | null;
  distanceKm?: number | null;
  productCount?: number;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: {
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
  }[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  category?: string;
  imageUrl?: string;
}

export function useStoreData() {
  const params = useParams();
  const storeId = params.id as string;
  const { user } = useAuthContext();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, [storeId, user]); // Added user to dependency array to re-fetch if user changes

  const loadStoreData = async () => {
    try {
      setLoading(true);
      
      // Load store details
      const storeResponse = await fetch(`/api/v1/stores/${storeId}`, {
        credentials: 'include',
      });
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        setStore(storeData.data);
        if (user && storeData?.data?.user?.id) {
          setIsOwner(user.id === storeData.data.user.id);
        } else {
          setIsOwner(false);
        }
      } else {
        setError('Store not found');
        return;
      }

      // Load store products
      const productsResponse = await fetch(`/api/v1/stores/${storeId}/products`, {
        credentials: 'include',
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.data.products || []);
      }
      
    } catch (error) {
      setError('Failed to load store data');
      console.error('Failed to load store data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { store, products, loading, error, isOwner, storeId };
}
