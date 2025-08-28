'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/client/shared/components/button';
import Spinner from '@/client/shared/components/spinner';
import { useStore } from '@/client/modules/stores/hooks/useStore';
import { useStoreProducts } from '@/client/modules/product/hooks/useStoreProducts';
import { useProductFilters, ViewMode } from '@/client/modules/product/hooks/useProductFilters';
import { StoreProductBreadcrumb } from '@/client/modules/product/components/StoreProductBreadcrumb';
import { StoreHeader } from '@/client/modules/stores/components/StoreHeader';
import { ProductFilters } from '@/client/modules/product/components/ProductFilters';
import { ProductList } from '@/client/modules/product/components/ProductList';

export  function StoreProductsView() {
    const params = useParams();
    const storeId = params.id as string;
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const { store, loading: storeLoading, error: storeError } = useStore(storeId);
    const { products, loading: productsLoading, error: productsError } = useStoreProducts(storeId);

    const {
        filteredProducts,
        searchTerm,
        setSearchTerm,
        availabilityFilter,
        setAvailabilityFilter,
        sortBy,
        setSortBy,
    } = useProductFilters(products);

    const loading = storeLoading || productsLoading;
    const error = storeError || productsError;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="xl" text="Loading products..." />
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen ">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏪</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Store Not Found
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            {error || 'The store you are looking for does not exist.'}
                        </p>
                        <Link href="/">
                            <Button variant="primary">
                                ← Back to Home
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StoreProductBreadcrumb store={store} />
                <StoreHeader store={store} productsCount={products.length} />

                <ProductFilters
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    availabilityFilter={availabilityFilter}
                    onAvailabilityFilterChange={setAvailabilityFilter}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Showing {filteredProducts.length} of {products.length} products
                        {searchTerm && ` for "${searchTerm}"`}
                    </p>
                </div>

                <ProductList
                    products={filteredProducts}
                    viewMode={viewMode}
                    storeId={store.id}
                    searchTerm={searchTerm}
                    onClearSearch={() => setSearchTerm('')}
                />
            </main>
        </div>
    );
}
