import { useState, useEffect } from 'react';
import {Product} from "@/lib/modules/product/schema/product";

export function useStoreProducts(storeId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/stores/${storeId}/products`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.data?.payload || []);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to load products');
        }
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId]);

  return { products, loading, error };
}
