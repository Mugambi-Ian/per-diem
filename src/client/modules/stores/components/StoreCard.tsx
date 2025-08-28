'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Globe, Ruler, Clock } from 'lucide-react';
import {Store} from "@/lib/modules/stores/schema/store";


interface StoreCardProps {
  store: Store;
  className?: string;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, className = '' }) => {
  const [localTime, setLocalTime] = useState<string>('');

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        timeZone: store.timezone,
        hour12: false,
      });
      setLocalTime(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [store.timezone]);

  const isOpen = store.isCurrentlyOpen;
  const statusText = isOpen ? 'Open' : 'Closed';

  // Generate initials for logo
  const initials = store.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
      <div
          className={`rounded-2xl 
        bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-slate-800/90
        text-gray-900 dark:text-white
        shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700
        p-6 transition-transform hover:scale-[1.03] hover:shadow-xl duration-300
        ${className}`}
      >
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full
                          text-xl font-bold bg-gray-100 text-gray-900
                          dark:bg-slate-700 dark:text-white shadow-inner">
              {initials}
            </div>

            {/* Name & Slug */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold">{store.name}</h3>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium 
                  ${isOpen
                        ? 'bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400'}`}
                >
                {statusText}
              </span>
              </div>
              <span className="inline-flex items-center rounded-full px-2 py-0.5
                             text-xs font-medium bg-gray-100 text-gray-500
                             dark:bg-slate-700 dark:text-slate-300">
              {store.slug}
            </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col space-y-2 text-sm text-gray-600 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500 dark:text-red-400" /> {store.address}
            </p>
            <p className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" /> {store.timezone}
            </p>
            {store.distanceKm && (
                <p className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  {store.distanceKm.toFixed(2)} km
                </p>
            )}
          </div>

          {/* Status & Time */}
          <div className="flex items-center justify-between">
            {!isOpen && store.nextOpenTime && (
                <span className="text-xs text-gray-500 dark:text-slate-400">
              Opens {new Date(store.nextOpenTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </span>
            )}
            <p className="flex items-center gap-1 text-sm text-gray-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> {localTime}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
            <Link
                href={`/stores/${store.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800
                       dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Details
            </Link>
            <Link
                href={`/stores/${store.id}/products`}
                className="text-sm font-medium text-green-600 hover:text-green-800
                       dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >
              Products
            </Link>
            <Link
                href={`/stores/${store.id}/order`}
                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500
                       text-sm font-medium text-white shadow-md transition"
            >
              Order
            </Link>
          </div>
        </div>
      </div>
  );
};

export default StoreCard;
