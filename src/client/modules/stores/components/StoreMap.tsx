'use client';

import Link from 'next/link';
import { useStoreMap } from '../hooks/useStoreMap';
import Card, { CardBody } from '@/client/shared/components/card';
import Map from "@/client/shared/components/map";
import {Store} from "@/lib/modules/stores/schema/store";

interface StoreMapProps {
  stores: Store[];
}

export default function StoreMap({ stores }: StoreMapProps) {
  const { center, markers } = useStoreMap(stores);

  if (stores.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stores on the map yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Check back soon for stores in your area!
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      {/* Map Component */}
      <Card>
        <CardBody className="p-0">
          <Map
            center={center}
            markers={markers}
            height="500px"
            className="rounded-lg"
          />
        </CardBody>
      </Card>

      {/* Store List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.id} variant="outlined" className="hover:shadow-md transition-shadow">
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {store.address}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  store.isCurrentlyOpen ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  🌍 {store.timezone}
                </p>
                {store.currentLocalTime && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    🕐 {store.currentLocalTime}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  📦 {store.productCount} products
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  store.isCurrentlyOpen ? 'text-green-600' : 'text-red-600'
                }`}>
                  {store.isCurrentlyOpen ? 'Open' : 'Closed'}
                </span>
                <div className="flex space-x-2">
                  <Link
                    href={`/stores/${store.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/stores/${store.id}/products`}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                  >
                    Order
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
