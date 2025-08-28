'use client';

import React from 'react';
import Map from '@/client/shared/components/map';
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

interface StoreLocationTabProps {
  store: Store;
}

export const StoreLocationTab: React.FC<StoreLocationTabProps> = ({ store }) => {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
      <div className="px-4 py-6 sm:px-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Location
        </h2>
        <div className="space-y-4">
          <div className="h-96 rounded-lg overflow-hidden">
            <Map
              center={{ lat: store.lat, lng: store.lng, name: store.name }}
              markers={[{ lat: store.lat, lng: store.lng, name: store.name }]}
              height="100%"
              zoom={15}
            />
          </div>
          
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Address
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {store.address}
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                📍 Get Directions
              </Button>
              <Button variant="outline" size="sm">
                📋 Copy Address
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
