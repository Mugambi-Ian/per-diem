import { useState, useEffect } from 'react';
import {Product} from "@/lib/modules/product/schema/product";
import {Store} from "@/lib/modules/stores/schema/store";

interface UseStoreProductsDataProps {
    storeId: string;
}

export function useStoreProductsData({ storeId }: UseStoreProductsDataProps) {
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
                    setProducts(productsData.data?.payload || []);
                }
                
            } catch (error) {
                setError('Failed to load store data');
            } finally {
                setLoading(false);
            }
        };
        loadStoreData();
    }, [storeId]);

    return {
        store,
        products,
        loading,
        error,
    };
}
