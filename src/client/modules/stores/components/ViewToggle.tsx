'use client';

interface ViewToggleProps {
  onViewChange: (view: 'grid' | 'map') => void;
  currentView: 'grid' | 'map';
}

export default function ViewToggle({ onViewChange, currentView }: ViewToggleProps) {
  return (
      <div className="flex justify-center mb-8">
        <div className="rounded-lg p-1 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5 bg-white dark:bg-gray-800">
          <button
              onClick={() => onViewChange('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'grid'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid View</span>
            </div>
          </button>
          <button
              onClick={() => onViewChange('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'map'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                />
              </svg>
              <span>Map View</span>
            </div>
          </button>
        </div>
      </div>
  );
}
