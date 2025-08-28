'use client';

import React from 'react';

interface StoreTabsProps {
  activeTab: 'overview' | 'products' | 'hours' | 'location';
  setActiveTab: (tab: 'overview' | 'products' | 'hours' | 'location') => void;
}

export const StoreTabs: React.FC<StoreTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'hours', label: 'Hours' },
    { id: 'location', label: 'Location' }
  ];

  return (
    <div className="mb-6">
      <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
