import { useState, useEffect } from 'react';
import {Store} from "@/lib/modules/stores/schema/store";

export function useStore(storeId: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchStore = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/stores/${storeId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStore(data.data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Store not found');
        }
      } catch (err) {
        setError('Failed to load store data');
        console.error('Failed to load store data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  return { store, loading, error };
}
