import React from 'react';
import { MapView } from '@/client/modules/stores/components';
import { StoreFormValues } from '@/client/modules/stores/hooks/useStoreForm';

interface BasicInfoSectionProps {
    formData: StoreFormValues;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleLocationSelect: (lat: number, lng: number) => void;
    generateSlug: () => void;
    TIMEZONES: string[];
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
    formData,
    handleChange,
    handleLocationSelect,
    generateSlug,
    TIMEZONES,
}) => {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Store Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter store name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Store Slug *
                    </label>
                    <div className="flex">
                        <input
                            type="text"
                            name="slug"
                            required
                            value={formData.slug}
                            onChange={handleChange}
                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-l-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="store-slug"
                        />
                        <button
                            type="button"
                            onClick={generateSlug}
                            className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-r-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium"
                        >
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                </label>
                <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter store address"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Timezone *
                    </label>
                    <select
                        name="timezone"
                        required
                        value={formData.timezone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                        {TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Latitude *
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="lat"
                        required
                        value={formData.lat}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="40.7128"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Longitude *
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="lng"
                        required
                        value={formData.lng}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="-74.0060"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Location Map
                </label>
                <MapView
                    lat={formData.lat}
                    lng={formData.lng}
                    address={formData.address}
                    onLocationSelect={handleLocationSelect}
                />
            </div>
        </div>
    );
};
