'use client';

import { useState } from 'react';
import ViewToggle from '@/client/modules/stores/components/ViewToggle';
import StoreGrid from '@/client/modules/stores/components/StoreGrid';
import StoreMap from '@/client/modules/stores/components/StoreMap';
import Link from 'next/link';
import {PlusCircle} from "lucide-react";
import Button from "@/client/shared/components/button";
import Input from "@/client/shared/components/input";
import Spinner from "@/client/shared/components/spinner";
import { useAllStores } from '../hooks/useAllStores';

export default function AllStoresView() {
  const {
    stores,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filterOpen,
    setFilterOpen,
    handleSearch,
  } = useAllStores();
  const [currentView, setCurrentView] = useState<'grid' | 'map'>('grid');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" text="Loading stores..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 ">
          <div className="flex justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                All Stores
              </h1>
              <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Discover and explore all available stores
              </p>
            </div>
            <Link href="/stores/new">
              <Button variant="outline">
                <PlusCircle size={18}/> <span className="hidden md:flex px-2"> New Store </span>
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
          <div className="px-4 py-6 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Search stores by name, address, or slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-r-none"
                  />
                  <Button
                    type="submit"
                    className="rounded-l-none"
                  >
                    Search
                  </Button>
                </div>
              </form>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="createdAt">Created Date</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status:
                  </label>
                  <select
                    value={filterOpen === null ? 'all' : filterOpen.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterOpen(value === 'all' ? null : value === 'true');
                    }}
                    className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Stores</option>
                    <option value="true">Open Only</option>
                    <option value="false">Closed Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <ViewToggle 
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Stores Content */}
        {stores.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
            <div className="px-4 py-12 sm:px-6">
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏪</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No stores found' : 'No stores available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.'
                    : 'Check back soon for stores in your area!'
                  }
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'grid' ? (
              <StoreGrid stores={stores} />
            ) : (
              <StoreMap stores={stores} />
            )}
          </>
        )}

        {/* Stats */}
        {stores.length > 0 && (
          <div className="mt-8 rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
            <div className="px-4 py-6 sm:px-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Store Statistics</h3>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Stores</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{stores.length}</dd>
                </div>
                <div className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Currently Open</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                    {stores.filter(s => s.isCurrentlyOpen).length}
                  </dd>
                </div>
                <div className="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Currently Closed</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                    {stores.filter(s => !s.isCurrentlyOpen).length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}