'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/client/shared/components/button';

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

interface StoreOverviewTabProps {
  store: Store;
  products: Product[];
}

export const StoreOverviewTab: React.FC<StoreOverviewTabProps> = ({ store, products }) => {
  const statusText = store.isCurrentlyOpen ? 'Open' : 'Closed';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
          <div className="px-4 py-6 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About {store.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {store.description || `Welcome to ${store.name}! We offer a wide selection of products and services to meet your needs.`}
            </p>
            
            <div className="space-y-2">
              {store.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  📞 <span className="font-medium">Phone:</span> {store.phone}
                </p>
              )}
              {store.email && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ✉️ <span className="font-medium">Email:</span> {store.email}
                </p>
              )}
              {store.website && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  🌐 <span className="font-medium">Website:</span> 
                  <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
                    {store.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
          <div className="px-4 py-6 sm:px-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Store Stats
            </h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-300">Status</dt>
                <dd className={`font-medium ${
                  store.isCurrentlyOpen ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusText}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-300">Products</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {products.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-300">Timezone</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {store.timezone}
                </dd>
              </div>
              {store.distanceKm && (
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-300">Distance</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {store.distanceKm.toFixed(2)} km
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
          <div className="px-4 py-6 sm:px-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href={`/stores/${store.id}/products`} className="block">
                <Button variant="primary" className="w-full">
                  Browse Products
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                📞 Call Store
              </Button>
              <Button variant="outline" className="w-full">
                📍 Get Directions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
