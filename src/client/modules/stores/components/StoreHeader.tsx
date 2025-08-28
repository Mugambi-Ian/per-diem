'use client';

import React from 'react';
import {Store} from "@/lib/modules/stores/schema/store";

interface StoreHeaderProps {
  store: Store;
  productsCount: number;
  children?: React.ReactNode;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ store, productsCount, children }) => {
  const statusColor = store.isCurrentlyOpen ? 'bg-green-500' : 'bg-red-500';
  const statusText = store.isCurrentlyOpen ? 'Open' : 'Closed';

  const initials = store.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 text-2xl font-bold text-gray-900 dark:text-white">
          {initials}
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {store.name}
            </h1>
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              store.isCurrentlyOpen 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${statusColor} mr-2`}></div>
              <span>{statusText}</span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            📍 {store.address}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>🌍 {store.timezone}</span>
            {store.distanceKm && (
              <span>📏 {store.distanceKm.toFixed(2)} km away</span>
            )}
            <span>📦 {productsCount} products</span>
          </div>
        </div>

        <div className="flex space-x-3">
            {children}
        </div>
      </div>
    </div>
  );
};

