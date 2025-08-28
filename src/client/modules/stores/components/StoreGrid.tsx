'use client';
import StoreCard from "@/client/modules/stores/components/StoreCard";
import {Store} from "@/lib/modules/stores/schema/store";


interface StoreGridProps {
  stores: Store[];
}

export default function StoreGrid({ stores }: StoreGridProps) {
  if (stores.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
        <div className="px-4 py-12 sm:px-6">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏪</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stores available yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Check back soon for amazing stores in your area!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <div key={store.id} className="group">
          <StoreCard store={store} />
        </div>
      ))}
    </div>
  );
}
