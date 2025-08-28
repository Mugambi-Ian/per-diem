'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/client/shared/components/button';
import Card, { CardBody } from '@/client/shared/components/card';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  category?: string;
  imageUrl?: string;
  isAvailableNow?: boolean;
  availabilityStatus?: string;
  sku?: string;
}

interface StoreProductsTabProps {
  storeId: string;
  products: Product[];
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  storeId: string;
}

function ProductCard({ product, viewMode, storeId }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardBody>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {product.category && (
                      <span>📂 {product.category}</span>
                    )}
                    {product.sku && (
                      <span>🏷️ {product.sku}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`text-sm px-2 py-1 rounded ${
                    product.isAvailableNow 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {product.isAvailableNow ? 'Available' : product.availabilityStatus}
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {product.currency} {product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              <Link href={`/stores/${storeId}/products/${product.id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <Button 
                variant="primary" 
                disabled={!product.isAvailableNow}
                className="whitespace-nowrap"
              >
                {product.isAvailableNow ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardBody className="p-4">
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-4xl">📦</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
              {product.name}
            </h3>
            <span className={`text-sm px-2 py-1 rounded ${
                product.isAvailableNow
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
                    {product.isAvailableNow ? 'Available' : product.availabilityStatus}
                  </span>
          </div>

          {product.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">
              {product.currency} {product.price.toFixed(2)}
            </span>
            {product.category && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.category}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href={`/stores/${storeId}/products/${product.id}/edit`}>
              <Button variant="outline" size="sm" className="w-full">Edit</Button>
            </Link>
            <Button 
              variant="primary" 
              size="sm"
              disabled={!product.isAvailableNow}
              className="w-full"
            >
              {product.isAvailableNow ? 'Add' : 'Out'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export const StoreProductsTab: React.FC<StoreProductsTabProps> = ({ storeId, products }) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
      <div className="px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Products ({products.length})
          </h2>
          <Link href={`/stores/${storeId}/products`}>
            <Button variant="primary">
              View All Products
            </Button>
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📦</div>
            <p className="text-gray-600 dark:text-gray-300">
              No products available at the moment.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {products.slice(0, 6).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                viewMode={viewMode}
                storeId={storeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
